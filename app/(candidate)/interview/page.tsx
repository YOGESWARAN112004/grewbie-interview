import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import InterviewRoom from '@/components/interview/InterviewRoom'

export default async function InterviewPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { application: { include: { interview: true } } },
    })

    if (!user) redirect('/sign-in')
    if (!user.application) redirect('/apply')

    // If interview already completed, show dashboard
    if (user.application.interview?.status === 'COMPLETED') {
        redirect('/dashboard')
    }

    return (
        <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
            <InterviewRoom
                applicationId={user.application.id}
                candidateName={user.name}
            />
        </main>
    )
}
