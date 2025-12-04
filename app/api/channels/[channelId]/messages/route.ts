import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const MESSAGES_PER_PAGE = 50

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || String(MESSAGES_PER_PAGE))

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
        { status: 403 }
      )
    }

    const where = {
      channelId,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1 // Fetch one extra to check if there are more
    })

    const hasMore = messages.length > limit
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages

    return NextResponse.json({
      messages: messagesToReturn.reverse(), // Return in ascending order (oldest first)
      hasMore,
      nextCursor: hasMore ? messagesToReturn[0].createdAt.toISOString() : null
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

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
        { status: 403 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        channelId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    })

    await prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}