import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateInterviewPrompt } from '@/lib/generateInterviewPrompt'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { applicationId } = await req.json()

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const application = await prisma.application.findUnique({
        where: { id: applicationId, userId: user.id },
        include: { interview: true },
    })

    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (application.interview?.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Interview already completed' }, { status: 409 })
    }

    // Generate dynamic interview prompt via OpenAI using all form data
    const systemPrompt = await generateInterviewPrompt({
        name: user.name,
        roles: application.roles,
        commitment: application.commitment,
        experience: application.experience,
        traits: application.traits,
        equityInterest: application.equityInterest,
        motivation: application.motivation,
        ownershipEg: application.ownershipEg,
    })

    const vapiCallId = randomUUID()

    // Create or update interview record (handles both fresh starts and re-attempts)
    if (application.interview) {
        await prisma.interview.update({
            where: { applicationId: application.id },
            data: {
                vapiCallId,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        })
    } else {
        await prisma.interview.create({
            data: {
                applicationId: application.id,
                vapiCallId,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        })
    }

    return NextResponse.json({
        callId: vapiCallId,
        systemPrompt,
        firstMessage: `Hi ${user.name}, I'm your AI interviewer today. We have exactly 10 minutes together. Let's get started — based on your application, I see you're interested in ${application.roles.join(' and ')}. Can you briefly introduce yourself and tell me what excites you most about this opportunity?`
    })
}
