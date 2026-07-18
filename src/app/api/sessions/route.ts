import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const sessions = await Session.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('GET sessions API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await dbConnect();

    const targetSession = await Session.findOne({ _id: id, userId: session.user.id });
    if (!targetSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (targetSession.sessionToken === session.user.sessionToken) {
      return NextResponse.json({ error: 'You cannot delete your current session' }, { status: 400 });
    }

    await Session.deleteOne({ _id: id });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error('DELETE session API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
