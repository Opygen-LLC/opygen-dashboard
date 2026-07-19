import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { transactionSchema } from '@/lib/validations';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Check if User model is registered to ensure population works
    if (!User) {
      console.warn("User model not loaded");
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const user = searchParams.get('user');

    const query: any = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (user) query.user = user;

    const transactions = await Transaction.find(query)
      .populate('user', 'name email avatarUrl')
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const parseResult = transactionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const transactionData = parseResult.data;

    const newTransaction = new Transaction(transactionData);
    await newTransaction.save();
    
    // Populate user before returning
    await newTransaction.populate('user', 'name email avatarUrl');

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
