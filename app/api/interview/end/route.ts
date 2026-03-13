import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateFeedback } from '@/lib/generateFeedback'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { applicationId, transcript, duration } = await req.json()

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const application = await prisma.application.findUnique({
        where: { id: applicationId, userId: user.id },
        include: { interview: true },
    })

    if (!application || !application.interview) {
        return NextResponse.json({ error: 'Application/interview not found' }, { status: 404 })
    }

    // Generate AI feedback from transcript
    let aiFeedback: string | null = null
    try {
        if (transcript?.length > 0) {
            aiFeedback = await generateFeedback(transcript, user.name, application.roles)
        }
    } catch (err) {
        console.error('Feedback generation error:', err)
    }

    // Save transcript + feedback to DB
    await prisma.interview.update({
        where: { applicationId: application.id },
        data: {
            transcript,
            aiFeedback,
            duration: duration || 900,
            status: 'COMPLETED',
            endedAt: new Date(),
        },
    })

    return NextResponse.json({ success: true, feedback: aiFeedback })
}
