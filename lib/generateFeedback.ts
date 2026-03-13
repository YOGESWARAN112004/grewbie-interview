import { openai } from './openai'

interface Message {
    role: string
    content: string
}

export async function generateFeedback(
    transcript: Message[],
    candidateName: string,
    roles: string[]
): Promise<string> {
    const transcriptText = transcript
        .map((m) => `${m.role === 'assistant' ? 'Interviewer' : candidateName}: ${m.content}`)
        .join('\n')

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are a senior hiring manager reviewing an interview transcript. 
Provide structured feedback on the candidate in JSON format with these fields:
{
  "overallScore": number (1-10),
  "strengths": string[] (3-5 bullet points),
  "concerns": string[] (2-4 bullet points),
  "communicationScore": number (1-10),
  "technicalScore": number (1-10),
  "cultureScore": number (1-10),
  "recommendation": "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE",
  "summary": string (2-3 sentences),
  "nextSteps": string
}`,
            },
            {
                role: 'user',
                content: `Candidate: ${candidateName}
Applied for: ${roles.join(', ')}

Interview Transcript:
${transcriptText}

Evaluate this candidate and return the JSON feedback object.`,
            },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
    })

    return completion.choices[0]?.message?.content ?? '{}'
}
