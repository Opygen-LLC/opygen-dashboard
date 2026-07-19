import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Statement from '@/models/Statements';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Check if User model is registered to ensure population works
    if (!User) {
      console.warn("User model not loaded");
    }

    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Users can only view their own statements unless they are admin
    if (session.user.role !== 'admin' && session.user.id !== user) {
      return NextResponse.json({ error: 'Unauthorized. You can only view your own statements.' }, { status: 403 });
    }

    const query: any = {};
    if (user) query.user = user;

    const skip = (page - 1) * limit;

    const statements = await Statement.find(query)
      .populate('user', 'name email avatarUrl')
      .populate('transaction')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    const total = await Statement.countDocuments(query);
    
    return NextResponse.json({
      statements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error: any) {
    console.error("Fetch statements error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
