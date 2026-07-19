import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { TransactionCategory, TransactionType } from '@/types';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Aggregation pipeline to get summary stats
    const [summary] = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
            }
          },
          totalSalaries: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.SALARY] }, "$amount", 0]
            }
          },
          totalLoansGiven: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_GIVEN] }, "$amount", 0]
            }
          },
          totalLoansRepaid: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_REPAYMENT] }, "$amount", 0]
            }
          }
        }
      }
    ]);

    const stats = summary || {
      totalIncome: 0,
      totalExpense: 0,
      totalSalaries: 0,
      totalLoansGiven: 0,
      totalLoansRepaid: 0,
    };

    const netBalance = stats.totalIncome - stats.totalExpense;
    const outstandingLoans = stats.totalLoansGiven - stats.totalLoansRepaid;

    return NextResponse.json({
      ...stats,
      netBalance,
      outstandingLoans
    });
  } catch (error: any) {
    console.error("Fetch finance summary error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
