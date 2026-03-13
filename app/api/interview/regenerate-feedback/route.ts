import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateFeedback } from '@/lib/generateFeedback'
import { NextResponse } from 'next/server'

// POST /api/interview/regenerate-feedback
// Regenerates AI feedback from an already-saved transcript
// Used when: beacon saved transcript but feedback generation didn't complete,
// or admin wants to re-analyze with the latest prompt
export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only admins can regenerate feedback
    const admin = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!admin || admin.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { applicationId } = await req.json()
    if (!applicationId) {
        return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })
    }

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { interview: true, user: true },
    })

    if (!application || !application.interview) {
        return NextResponse.json({ error: 'Application/interview not found' }, { status: 404 })
    }

    const transcript = application.interview.transcript as Array<{ role: string; content: string }> | null
    if (!transcript || transcript.length === 0) {
        return NextResponse.json({ error: 'No transcript data available to analyze' }, { status: 400 })
    }

    console.log('[Regenerate Feedback] Processing', transcript.length, 'messages for', application.user.name)

    try {
        const aiFeedback = await generateFeedback(transcript, application.user.name, {
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

        await prisma.interview.update({
            where: { applicationId: application.id },
            data: { aiFeedback, status: 'COMPLETED' },
        })

        console.log('[Regenerate Feedback] Success — feedback length:', aiFeedback.length)
        return NextResponse.json({ success: true, feedback: aiFeedback })
    } catch (err) {
        console.error('[Regenerate Feedback] Error:', err)
        return NextResponse.json({ error: 'Feedback generation failed' }, { status: 500 })
    }
}
