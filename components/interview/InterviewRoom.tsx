'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Vapi from '@vapi-ai/web'
import { useInterviewStore, INTERVIEW_DURATION } from '@/store/interviewStore'

interface Props {
    applicationId: string
    candidateName: string
}

let vapiInstance: Vapi | null = null

export default function InterviewRoom({ applicationId, candidateName }: Props) {
    const router = useRouter()
    const cameraRef = useRef<HTMLVideoElement>(null)
    const screenRef = useRef<HTMLVideoElement>(null)
    const cameraStreamRef = useRef<MediaStream | null>(null)
    const screenStreamRef = useRef<MediaStream | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const endedRef = useRef(false)

    const {
        status, transcript, elapsed, timeRemaining,
        cameraReady, screenReady, errorMessage,
        setStatus, addMessage, setCallId, tick,
        setCameraReady, setScreenReady, setError, reset,
    } = useInterviewStore()

    const canStart = cameraReady && screenReady

    // Format timer display MM:SS
    const fmt = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0')
        const sec = (s % 60).toString().padStart(2, '0')
        return `${m}:${sec}`
    }

    const endInterview = useCallback(async () => {
        if (endedRef.current) return
        endedRef.current = true

        if (timerRef.current) clearInterval(timerRef.current)
        setStatus('ended')

        // Stop media streams
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
        screenStreamRef.current?.getTracks().forEach((t) => t.stop())

        // Stop Vapi call
        try { vapiInstance?.stop() } catch { }

        // Wait 2 seconds for any remaining transcript messages to flush through Vapi
        console.log('[Interview End] Waiting 2s for transcript messages to flush...')
        await new Promise((r) => setTimeout(r, 2000))

        // Read latest state directly from store to avoid stale closure
        const currentState = useInterviewStore.getState()
        const currentTranscript = currentState.transcript
        const currentElapsed = currentState.elapsed

        console.log('[Interview End] Store state — transcript length:', currentTranscript.length, 'elapsed:', currentElapsed)
        console.log('[Interview End] Transcript messages:', JSON.stringify(currentTranscript.map(m => ({ role: m.role, content: m.content.substring(0, 50) }))))

        // Save transcript + generate feedback
        try {
            console.log('[Interview End] Sending transcript with', currentTranscript.length, 'messages, elapsed:', currentElapsed)
            const res = await fetch('/api/interview/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    transcript: currentTranscript,
                    duration: currentElapsed,
                }),
            })
            if (!res.ok) {
                const errData = await res.json()
                console.error('[Interview End] API error:', res.status, errData)
            } else {
                const result = await res.json()
                console.log('[Interview End] API response:', result)
            }
        } catch (err) {
            console.error('Failed to save interview:', err)
        }

        router.push('/dashboard')
    }, [applicationId, router, setStatus])

    // Auto-end at 15 minutes
    useEffect(() => {
        if (status === 'active') {
            timerRef.current = setInterval(() => {
                tick()
            }, 1000)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [status, tick])

    useEffect(() => {
        if (timeRemaining === 0 && status === 'active') {
            endInterview()
        }
    }, [timeRemaining, status, endInterview])

    // Cleanup on unmount — save transcript as last resort via beacon
    useEffect(() => {
        const saveBeacon = () => {
            const state = useInterviewStore.getState()
            if (state.transcript.length > 0 && !endedRef.current) {
                console.log('[Interview Beacon] Saving', state.transcript.length, 'messages via beacon on unmount/close')
                navigator.sendBeacon(
                    '/api/interview/end',
                    new Blob([JSON.stringify({
                        applicationId,
                        transcript: state.transcript,
                        duration: state.elapsed,
                    })], { type: 'application/json' })
                )
            }
        }

        // Save on tab close / refresh
        window.addEventListener('beforeunload', saveBeacon)

        return () => {
            window.removeEventListener('beforeunload', saveBeacon)
            if (timerRef.current) clearInterval(timerRef.current)
            cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
            screenStreamRef.current?.getTracks().forEach((t) => t.stop())
            // Last-resort save on component unmount (e.g. navigation away)
            saveBeacon()
        }
    }, [applicationId])

    const requestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            cameraStreamRef.current = stream
            if (cameraRef.current) {
                cameraRef.current.srcObject = stream
                cameraRef.current.play()
            }
            setCameraReady(true)
        } catch {
            setError('Camera/microphone access denied. Please allow permissions and reload.')
        }
    }

    const requestScreen = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
            screenStreamRef.current = stream
            if (screenRef.current) {
                screenRef.current.srcObject = stream
                screenRef.current.play()
            }
            setScreenReady(true)
            // If user stops screen share
            stream.getVideoTracks()[0].addEventListener('ended', () => setScreenReady(false))
        } catch {
            setError('Screen share was cancelled or denied.')
        }
    }

    const startInterview = async () => {
        if (!canStart) return
        setStatus('connecting')
        endedRef.current = false

        try {
            const res = await fetch('/api/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Init Vapi
            vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)
            setCallId(data.callId)

            vapiInstance.on('speech-start', () => { })
            vapiInstance.on('speech-end', () => { })

            vapiInstance.on('message', (msg: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
                console.log('[Vapi Message]', msg.type, msg.transcriptType ?? '', msg.role ?? '', (msg.transcript ?? '').substring(0, 80))
                if (msg.type === 'transcript' && msg.transcriptType === 'final') {
                    const newMsg = {
                        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
                        content: msg.transcript ?? '',
                        timestamp: Date.now(),
                    }
                    addMessage(newMsg)
                    console.log('[Vapi Message] Added to store. Current store length:', useInterviewStore.getState().transcript.length)
                }
            })

            vapiInstance.on('call-end', () => {
                console.log('[Vapi call-end] Call ended')
                if (!endedRef.current) endInterview()
            })

            vapiInstance.on('error', (err: any) => {
                console.error('Vapi error detail:', err)
                if (err && typeof err === 'object') {
                    console.error('Vapi error keys:', Object.keys(err))
                    console.error('Vapi error message:', err.message || err.error)
                }
                // On error, save whatever transcript we have — don't lose data
                console.log('[Vapi Error] Triggering endInterview to save transcript data')
                if (!endedRef.current) endInterview()
            })

            await vapiInstance.start({
                name: 'AI Interviewer',
                model: {
                    provider: 'openai',
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: data.systemPrompt }
                    ]
                },
                voice: { provider: 'openai', voiceId: 'nova' },
                firstMessage: data.firstMessage,
                maxDurationSeconds: 600, // 10 mins hard limit
                silenceTimeoutSeconds: 300, // 5 min silence threshold
                responseDelaySeconds: 1.2, // Wait 1.2s after candidate stops speaking before AI responds
                endCallFunctionEnabled: false, // Don't let the AI end the call on its own
            } as any)

            setStatus('active')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to start interview'
            setError(message)
        }
    }

    const urgency = timeRemaining <= 60 ? 'urgent' : timeRemaining <= 180 ? 'warn' : 'normal'

    if (status === 'ended') {
        return (
            <div className="ended-screen animate-fadeUp">
                <div className="ended-icon animate-pop">✓</div>
                <h2>Interview Complete</h2>
                <p>Great job, {candidateName}! Your responses have been recorded. We&apos;re generating your AI feedback now.</p>
                <p className="ended-sub">Redirecting to your dashboard...</p>
            </div>
        )
    }

    return (
        <div className="ir-container">
            {/* Header */}
            <div className="ir-header">
                <div className="badge"><span className="badge-dot" />AI Interview Session</div>
                <div className={`timer timer-${urgency}`}>
                    {status === 'idle' ? '10:00' : fmt(timeRemaining)}
                </div>
            </div>

            {/* Media previews */}
            <div className="media-grid">
                <div className="media-panel screen-panel">
                    <div className="media-label font-mono">SCREEN SHARE</div>
                    {screenReady ? (
                        <video ref={screenRef} className="screen-video" autoPlay muted playsInline />
                    ) : (
                        <div className="media-placeholder">
                            <div className="media-placeholder-icon">🖥️</div>
                            <div className="media-placeholder-text">Screen not shared</div>
                        </div>
                    )}
                    <div className={`media-status-badge ${screenReady ? 'ready' : 'not-ready'}`}>
                        {screenReady ? '● Live' : '○ Not sharing'}
                    </div>
                </div>

                <div className="media-panel camera-panel">
                    <div className="media-label font-mono">YOUR CAMERA</div>
                    {cameraReady ? (
                        <video ref={cameraRef} className="camera-video" autoPlay muted playsInline />
                    ) : (
                        <div className="media-placeholder">
                            <div className="media-placeholder-icon">📷</div>
                            <div className="media-placeholder-text">Camera off</div>
                        </div>
                    )}
                    <div className={`media-status-badge ${cameraReady ? 'ready' : 'not-ready'}`}>
                        {cameraReady ? '● Live' : '○ Off'}
                    </div>
                </div>
            </div>

            {/* Audio waveform (active state) */}
            {status === 'active' && (
                <div className="waveform">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="wave-bar"
                            style={{ animationDelay: `${i * 0.08}s` }}
                        />
                    ))}
                </div>
            )}

            {/* Transcript */}
            {transcript.length > 0 && (
                <div className="transcript-box">
                    <div className="transcript-label font-mono">LIVE TRANSCRIPT</div>
                    <div className="transcript-scroll">
                        {transcript.map((msg, i) => (
                            <div key={i} className={`transcript-msg ${msg.role}`}>
                                <span className="msg-role font-mono">{msg.role === 'assistant' ? 'AI' : 'YOU'}</span>
                                <span className="msg-content">{msg.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {errorMessage && (
                <div className="error-banner">{errorMessage}</div>
            )}

            <div className="controls">
                {status === 'idle' && (
                    <>
                        {!cameraReady && (
                            <button className="btn btn-ghost" onClick={requestCamera}>
                                📷 Enable Camera &amp; Mic
                            </button>
                        )}
                        {!screenReady && (
                            <button className="btn btn-ghost" onClick={requestScreen}>
                                🖥️ Share Screen
                            </button>
                        )}
                    </>
                )}

                {status === 'idle' && (
                    <div className="strict-warning-box">
                        <div className="sw-title font-mono">⚠️ STRICT INTERVIEW RULES ⚠️</div>
                        <ul>
                            <li><strong>ONE CHANCE ONLY:</strong> Once you click Start, you cannot restart the interview.</li>
                            <li><strong>DO NOT RELOAD:</strong> Refreshing or closing this tab will terminate your application.</li>
                            <li><strong>CONNECTION:</strong> Ensure you have a strong, stable internet connection before beginning.</li>
                        </ul>
                    </div>
                )}

                {status === 'idle' && (
                    <div className="controls">
                        <button
                            className="btn btn-primary start-btn"
                            onClick={startInterview}
                            disabled={!canStart}
                        >
                            {canStart ? '▶ Start 10-Min Interview' : 'Enable camera & screen to start'}
                        </button>
                    </div>
                )}

                {status === 'connecting' && (
                    <div className="connecting-indicator">
                        <div className="spinner" />
                        Connecting to AI interviewer...
                    </div>
                )}

                {status === 'active' && (
                    <div className="active-indicator">
                        <span className="active-dot" />
                        Interview in progress — timer auto-ends at 00:00
                    </div>
                )}
            </div>

            <style>{`
        .ir-container { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; position: relative; z-index: 1; }
        .ir-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .timer {
          font-family: 'Space Mono', monospace;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -1px;
          transition: color 0.5s;
        }
        .timer-normal { color: var(--text); }
        .timer-warn { color: var(--accent); }
        .timer-urgent { color: var(--red); animation: blink 0.8s infinite; }

        .media-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
        @media (max-width: 620px) { .media-grid { grid-template-columns: 1fr; } }

        .media-panel {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 4px; overflow: hidden; position: relative;
          aspect-ratio: 16/9;
        }
        .media-label {
          position: absolute; top: 10px; left: 12px;
          font-size: 10px; letter-spacing: 2px; color: var(--muted);
          z-index: 2; text-transform: uppercase;
        }
        .media-placeholder {
          width: 100%; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px;
        }
        .media-placeholder-icon { font-size: 28px; opacity: 0.4; }
        .media-placeholder-text { font-size: 12px; color: var(--muted); font-family: 'Space Mono', monospace; }
        .screen-video, .camera-video { width: 100%; height: 100%; object-fit: cover; }
        .media-status-badge {
          position: absolute; bottom: 10px; right: 12px;
          font-size: 10px; font-family: 'Space Mono', monospace;
          padding: 3px 8px; border-radius: 2px; border: 1px solid;
        }
        .media-status-badge.ready { color: var(--green); border-color: rgba(77,255,145,0.3); background: rgba(77,255,145,0.08); }
        .media-status-badge.not-ready { color: var(--muted); border-color: var(--border); background: transparent; }

        .waveform {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; height: 48px; margin-bottom: 20px;
        }
        .wave-bar {
          width: 4px; background: var(--accent); border-radius: 2px;
          animation: wave 1s ease-in-out infinite;
          height: 24px;
        }

        .transcript-box { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 20px; margin-bottom: 24px; }
        .transcript-label { font-size: 10px; letter-spacing: 2px; color: var(--muted); margin-bottom: 12px; text-transform: uppercase; }
        .transcript-scroll { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .transcript-msg { display: flex; gap: 12px; font-size: 14px; line-height: 1.5; }
        .msg-role { font-size: 10px; letter-spacing: 1px; padding-top: 2px; flex-shrink: 0; width: 28px; }
        .transcript-msg.assistant .msg-role { color: var(--accent); }
        .transcript-msg.user .msg-role { color: var(--blue); }
        .msg-content { color: var(--text); }

        .error-banner {
          background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.3);
          color: var(--red); padding: 12px 16px; border-radius: 2px;
          font-size: 13px; margin-bottom: 20px; font-family: 'Space Mono', monospace;
        }

        .strict-warning-box {
          background: rgba(255, 77, 109, 0.05); border: 1px solid rgba(255, 77, 109, 0.3);
          border-radius: 4px; padding: 20px; margin-bottom: 24px; text-align: left;
          max-width: 600px; width: 100%; margin: 20px auto;
        }
        .sw-title { color: var(--red); font-weight: 800; font-size: 13px; letter-spacing: 1px; margin-bottom: 12px; }
        .strict-warning-box ul { list-style-type: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .strict-warning-box li { color: var(--text); font-size: 13px; line-height: 1.5; padding-left: 20px; position: relative; }
        .strict-warning-box li::before { content: "•"; position: absolute; left: 4px; color: var(--red); font-weight: bold; }
        .strict-warning-box strong { color: var(--red); letter-spacing: 0.5px; }

        .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: center; }
        .start-btn { font-size: 15px; padding: 16px 32px; }

        .connecting-indicator {
          display: flex; align-items: center; gap: 12px;
          color: var(--muted); font-family: 'Space Mono', monospace; font-size: 13px;
        }
        .spinner {
          width: 20px; height: 20px; border: 2px solid var(--border);
          border-top-color: var(--accent); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .active-indicator {
          display: flex; align-items: center; gap: 8px;
          color: var(--muted); font-family: 'Space Mono', monospace; font-size: 12px;
          background: var(--card); border: 1px solid var(--border);
          padding: 10px 20px; border-radius: 2px;
        }
        .active-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); animation: blink 1s infinite; }

        .ended-screen { text-align: center; padding: 60px 24px; max-width: 480px; margin: 0 auto; }
        .ended-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(77,255,145,0.1); border: 2px solid var(--green);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; margin: 0 auto 24px;
        }
        .ended-screen h2 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
        .ended-screen p { color: var(--muted); font-size: 15px; line-height: 1.6; margin-bottom: 8px; }
        .ended-sub { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--accent); }
      `}</style>
        </div>
    )
}
