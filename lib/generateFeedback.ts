import { openai } from './openai'

interface Message {
    role: string
    content: string
}

interface ApplicationData {
    roles: string[]
    commitment: string
    experience: number
    traits: string[]
    equityInterest: string
    motivation: string
    ownershipEg?: string | null
    phone?: string | null
    portfolio?: string | null
}

export async function generateFeedback(
    transcript: Message[],
    candidateName: string,
    applicationData: ApplicationData
): Promise<string> {
    const transcriptText = transcript
        .map((m, i) => `[${i + 1}] ${m.role === 'assistant' ? 'Interviewer' : candidateName}: ${m.content}`)
        .join('\n')

    const rolesStr = applicationData.roles.join(', ')
    const traitsStr = applicationData.traits.join(', ')

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are a world-class hiring intelligence system. You have TWO sources of data about this candidate:

1. **APPLICATION FORM** — what they claimed about themselves when they applied
2. **INTERVIEW TRANSCRIPT** — what they actually said and how they performed under live questioning

Your job is to deeply cross-reference both sources. Verify claims from the form against interview performance. Flag inconsistencies. Score every dimension based on EVIDENCE from the transcript, not just what they wrote on the form.

CANDIDATE APPLICATION FORM DATA:
- Name: ${candidateName}
- Applied for: ${rolesStr}
- Experience: ${applicationData.experience} year(s)
- Commitment: ${applicationData.commitment}
- Self-described traits: ${traitsStr}
- Equity interest: ${applicationData.equityInterest}
- Motivation (their words): "${applicationData.motivation}"
${applicationData.ownershipEg ? `- Ownership example (their words): "${applicationData.ownershipEg}"` : '- No ownership example provided'}
${applicationData.portfolio ? `- Portfolio: ${applicationData.portfolio}` : '- No portfolio provided'}

Return EXACTLY this JSON structure:
{
  "overallScore": number (1-10),
  "recommendation": "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE",
  "summary": string (4-6 sentence executive briefing that CROSS-REFERENCES form claims with interview performance. Example: "Despite claiming 5 years of React experience on their form, the candidate struggled with basic component lifecycle questions..." or "Their stated motivation about AI innovation was convincingly backed up during the interview when they described..."),
  
  "scores": {
    "technical": number (1-10, based on depth demonstrated in the INTERVIEW, not what they claimed on the form),
    "communication": number (1-10, how clearly and concisely they articulated in the interview),
    "leadership": number (1-10, evidence of ownership, initiative, team management from interview answers),
    "creativity": number (1-10, novel ideas, product thinking, vision demonstrated in interviews),
    "pressureHandling": number (1-10, composure when challenged, pushed back on, or asked hard follow-ups),
    "problemSolving": number (1-10, structured thinking, analytical approach demonstrated),
    "cultureFit": number (1-10, values alignment, team dynamics, startup mindset based on both form AND interview),
    "authenticity": number (1-10, did their interview answers match their form claims? Were they genuine?)
  },

  "detailedBreakdown": {
    "technicalDepth": string (2-3 sentences: Cross-reference their claimed ${applicationData.experience} years experience with what they showed. Were they as skilled as their form suggests?),
    "communicationStyle": string (2-3 sentences: How did they articulate? Concise or rambling? Structured?),
    "leadershipSignals": string (2-3 sentences: Cross-reference with their traits "${traitsStr}" — did they actually demonstrate those traits?),
    "creativityAndVision": string (2-3 sentences: Did they show original thinking? Compare to their stated motivation.),
    "pressureResponse": string (2-3 sentences: How did they handle tough questions? Did they crack or stand firm?),
    "problemSolvingApproach": string (2-3 sentences: Structured vs ad-hoc thinking?),
    "authenticityCheck": string (2-3 sentences: CRITICAL — compare what they wrote on the form vs how they performed. Flag any inconsistencies between claimed experience/traits and actual demonstration.)
  },

  "formVsInterviewAnalysis": string (3-4 sentences specifically comparing what they claimed on the form to how they performed in the interview. Were their self-described traits accurate? Did their motivation statement hold up? Was their ownership example verified?),

  "strengths": string[] (4-6 specific, evidence-based bullet points citing actual interview moments, e.g. "[Msg 12] Demonstrated deep knowledge of distributed systems when explaining..."),
  "concerns": string[] (3-5 specific concerns with evidence, referencing message numbers),
  "redFlags": string[] (0-3 serious issues — dishonesty, fabrication, form-vs-interview mismatches. Empty if none.),
  
  "keyQuotes": string[] (3-5 most revealing direct quotes from the candidate),
  
  "personalityProfile": string (3-4 sentences painting a vivid picture of this person based on BOTH their form answers and interview behavior),
  
  "hiringConfidence": number (0-100),
  
  "nextSteps": string (1-2 sentences: specific action based on the analysis),

  "transcriptHighlights": [
    { "messageIndex": number, "category": "strength" | "concern" | "red_flag" | "notable", "note": string }
  ] (5-10 highlighted transcript moments with their index number, category, and a brief note explaining significance),

  "communicationScore": number (1-10, legacy — same as scores.communication),
  "technicalScore": number (1-10, legacy — same as scores.technical),
  "cultureScore": number (1-10, legacy — same as scores.cultureFit)
}`,
            },
            {
                role: 'user',
                content: `INTERVIEW TRANSCRIPT (each line prefixed with [message number]):
${transcriptText}

Produce the deep candidate evaluation JSON. Cross-reference the application form data with interview performance. Be brutally honest and specific. Reference actual transcript moments by message number.`,
            },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
    })

    return completion.choices[0]?.message?.content ?? '{}'
}
