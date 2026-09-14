import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Statement from '@/models/Statements';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Check if User and Transaction models are registered to ensure population works
    if (!User || !Transaction) {
      console.warn("User or Transaction model not loaded");
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

    const [statements, total, allUserStatements] = await Promise.all([
      Statement.find(query)
        .populate('user', 'name email avatarUrl')
        .populate('transaction')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Statement.countDocuments(query),
      Statement.find(query)
        .lean()
        .exec(),
    ]);

    // Calculate user's true lifetime totals across all statements (BDT)
    let totalIncome = 0;
    let totalExpense = 0;

    for (const stmt of allUserStatements) {
      const amt = Number(stmt.amount || 0);
      if (stmt.type === '+') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    }

    const totalBalance = Number((totalIncome - totalExpense).toFixed(2));
    const totalIncomeBdt = totalIncome;
    const totalExpenseBdt = totalExpense;
    const totalBalanceBdt = totalBalance;
    
    return NextResponse.json({
      statements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      summary: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalIncomeBdt: Number(totalIncomeBdt.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        totalExpenseBdt: Number(totalExpenseBdt.toFixed(2)),
        totalBalance,
        totalBalanceBdt,
      },
    });
  } catch (error: any) {
    console.error("Fetch statements error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
