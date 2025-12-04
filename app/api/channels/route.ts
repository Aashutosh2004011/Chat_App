import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const myChannels = searchParams.get('my') === 'true'

    let channels

    if (myChannels) {
      channels = await prisma.channel.findMany({
        where: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        },
        include: {
          _count: {
            select: { members: true }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    } else {
      channels = await prisma.channel.findMany({
        where: {
          isPrivate: false
        },
        include: {
          _count: {
            select: { members: true }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    }

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Get channels error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPrivate } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    const existingChannel = await prisma.channel.findUnique({
      where: { name: name.trim() }
    })

    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel with this name already exists' },
        { status: 400 }
      )
    }

    const channel = await prisma.channel.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPrivate: isPrivate || false,
        members: {
          create: {
            userId: session.user.id
          }
        }
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Create channel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}