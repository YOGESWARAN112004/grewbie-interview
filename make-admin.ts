import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const result = await prisma.user.updateMany({
        where: { email: '12147yogeshwaransnm@gmail.com' },
        data: { role: 'ADMIN' },
    })
    console.log('Update result:', result)
}

main().finally(() => prisma.$disconnect())
