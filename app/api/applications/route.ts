import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
        phone, portfolio, roles, commitment, experience,
        traits, equityInterest, motivation, ownershipEg,
    } = body

    // Validate required fields
    if (!roles?.length || !commitment || !traits?.length || !equityInterest || !motivation) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure user exists (auto-sync if webhook was delayed)
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown'

    const user = await prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        update: {},
        create: {
            clerkId: clerkUser.id,
            email,
            name,
            role: 'CANDIDATE',
        }
    })

    // Check for existing application
    const existing = await prisma.application.findUnique({ where: { userId: user.id } })
    if (existing) return NextResponse.json({ error: 'Application already exists', applicationId: existing.id }, { status: 409 })

    // Create application + empty interview record
    const application = await prisma.application.create({
        data: {
            userId: user.id,
            phone: phone || null,
            portfolio: portfolio || null,
            roles,
            commitment,
            experience: Number(experience) || 0,
            traits,
            equityInterest,
            motivation,
            ownershipEg: ownershipEg || null,
            interview: { create: {} },
        },
        include: { interview: true },
    })

    return NextResponse.json({ applicationId: application.id, interviewId: application.interview?.id })
}

export async function GET() {
    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find the user in DB
    const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } })
    if (!user) return NextResponse.json({ application: null })

    const application = await prisma.application.findUnique({
        where: { userId: user.id },
        include: { interview: true },
    })

    return NextResponse.json({ application })
}
