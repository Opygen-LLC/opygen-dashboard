import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Statement from '@/models/Statements';
import User from '@/models/User';

/**
 * POST /api/admin/recalculate-balances
 * 
 * Recalculates all user balances from scratch based on their statements.
 * Admin only. Use this to fix stale/broken balance data.
 * Optionally pass { userId } in the body to recalculate for a specific user only.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const specificUserId: string | undefined = body?.userId;

    // Build user list to recalculate
    let userIds: string[] = [];

    if (specificUserId) {
      userIds = [specificUserId];
    } else {
      // Get all distinct user IDs from statements
      const distinctUsers = await Statement.distinct('user');
      userIds = distinctUsers.map((id: any) => id.toString());
    }

    const results: { userId: string; oldBalance: number; newBalance: number }[] = [];

    for (const userId of userIds) {
      const statements = await Statement.find({ user: userId }).lean();

      const newBalance = statements.reduce((sum: number, stmt: any) => {
        const signed = stmt.type === '+' ? Number(stmt.amount) : -Number(stmt.amount);
        return sum + signed;
      }, 0);

      const user = await User.findById(userId);
      if (!user) continue;

      results.push({
        userId,
        oldBalance: user.balance ?? 0,
        newBalance,
      });

      await User.findByIdAndUpdate(userId, { $set: { balance: newBalance } });
    }

    return NextResponse.json({
      success: true,
      message: `Recalculated balances for ${results.length} user(s)`,
      results,
    });
  } catch (error: any) {
    console.error('Recalculate balances error:', error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
