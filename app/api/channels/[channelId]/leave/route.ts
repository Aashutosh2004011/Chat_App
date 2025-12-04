import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await params

    const member = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId
        }
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this channel' },
        { status: 400 }
      )
    }

    await prisma.channelMember.delete({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave channel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}