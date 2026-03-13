import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateFeedback } from '@/lib/generateFeedback'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    // Try auth — beacon requests may not carry auth cookies
    let userId: string | null = null
    try {
        const authResult = await auth()
        userId = authResult.userId
    } catch {
        console.warn('[Interview End API] Auth failed — likely a beacon request')
    }

    const { applicationId, transcript, duration } = await req.json()

    if (!applicationId) {
        return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })
    }

    // Find user — try by auth first, fallback to application lookup for beacon
    let user = null
    if (userId) {
        user = await prisma.user.findUnique({ where: { clerkId: userId } })
    }

    // Build query — if we have a user, scope to their ID for security; otherwise lookup by applicationId only (beacon fallback)
    const application = await prisma.application.findUnique({
        where: user
            ? { id: applicationId, userId: user.id }
            : { id: applicationId },
        include: { interview: true, user: true },
    })

    if (!application || !application.interview) {
        return NextResponse.json({ error: 'Application/interview not found' }, { status: 404 })
    }

    // If no user from auth, get from application
    if (!user) {
        user = application.user
    }

    // If interview is already COMPLETED with feedback, only update if new transcript is longer
    // This prevents beacon/duplicate saves from overwriting good data
    if (application.interview.status === 'COMPLETED' && application.interview.aiFeedback) {
        const existingTranscript = application.interview.transcript as any[] | null
        if (existingTranscript && existingTranscript.length >= (transcript?.length ?? 0)) {
            console.log('[Interview End API] Interview already completed with', existingTranscript.length, 'messages. New request has', transcript?.length ?? 0, '— skipping (keeping better data)')
            return NextResponse.json({ success: true, alreadyCompleted: true })
        }
    }

    // Generate AI feedback from transcript
    console.log('[Interview End API] Received transcript with', transcript?.length ?? 0, 'messages for application', applicationId)
    let aiFeedback: string | null = null
    try {
        if (transcript?.length > 0) {
            aiFeedback = await generateFeedback(transcript, user.name, {
                roles: application.roles,
                commitment: application.commitment,
                experience: application.experience,
                traits: application.traits,
                equityInterest: application.equityInterest,
                motivation: application.motivation,
                ownershipEg: application.ownershipEg,
                phone: application.phone,
                portfolio: application.portfolio,
            })
            console.log('[Interview End API] Generated feedback successfully, length:', aiFeedback?.length ?? 0)
        } else {
            console.warn('[Interview End API] No transcript messages received — skipping feedback generation')
        }
    } catch (err) {
        console.error('[Interview End API] Feedback generation error:', err)
    }

    // Save transcript + feedback to DB (always save transcript even if feedback failed)
    await prisma.interview.update({
        where: { applicationId: application.id },
        data: {
            transcript,
            ...(aiFeedback ? { aiFeedback } : {}), // Only overwrite feedback if we generated new feedback
            duration: duration || application.interview.duration || 0,
            status: 'COMPLETED',
            endedAt: new Date(),
        },
    })

    console.log('[Interview End API] Saved to DB. Transcript:', transcript?.length ?? 0, 'messages. Feedback:', aiFeedback ? 'yes' : 'no')

    return NextResponse.json({ success: true, feedback: aiFeedback })
}
