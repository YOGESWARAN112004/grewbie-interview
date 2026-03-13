import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'You must be signed in to use this route.' }, { status: 401 })

    const updatedUser = await prisma.user.update({
        where: { clerkId: userId },
        data: { role: 'ADMIN' },
    })

    return NextResponse.json({
        success: true,
        message: 'Your account is now an ADMIN.',
        user: updatedUser,
        nextSteps: 'Please navigate to http://localhost:3000/admin to view the dashboard.'
    })
}
