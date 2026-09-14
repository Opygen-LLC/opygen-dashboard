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
          totalIncomeBdt: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
            }
          },
          totalExpenseBdt: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
            }
          },
          totalSalaries: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.SALARY] }, "$amount", 0]
            }
          },
          totalSalariesBdt: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.SALARY] }, "$amount", 0]
            }
          },
          totalLoansTaken: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_TAKEN] }, "$amount", 0]
            }
          },
          totalLoansTakenBdt: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_TAKEN] }, "$amount", 0]
            }
          },
          totalLoansCollected: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_COLLECTED] }, "$amount", 0]
            }
          },
          totalLoansCollectedBdt: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_COLLECTED] }, "$amount", 0]
            }
          },
          totalLoansGiven: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_GIVEN] }, "$amount", 0]
            }
          },
          totalLoansGivenBdt: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_GIVEN] }, "$amount", 0]
            }
          },
          totalLoansRepaid: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_REPAYMENT] }, "$amount", 0]
            }
          },
          totalLoansRepaidBdt: {
            $sum: {
              $cond: [{ $eq: ["$category", TransactionCategory.LOAN_REPAYMENT] }, "$amount", 0]
            }
          }
        }
      }
    ]);

    const stats = summary || {
      totalIncome: 0,
      totalIncomeBdt: 0,
      totalExpense: 0,
      totalExpenseBdt: 0,
      totalSalaries: 0,
      totalSalariesBdt: 0,
      totalLoansTaken: 0,
      totalLoansTakenBdt: 0,
      totalLoansCollected: 0,
      totalLoansCollectedBdt: 0,
      totalLoansGiven: 0,
      totalLoansGivenBdt: 0,
      totalLoansRepaid: 0,
      totalLoansRepaidBdt: 0,
    };

    const netBalance = stats.totalIncome - stats.totalExpense;
    const netBalanceBdt = (stats.totalIncomeBdt || 0) - (stats.totalExpenseBdt || 0);

    const outstandingLoans = ((stats.totalLoansTaken || 0) + (stats.totalLoansCollected || 0)) - ((stats.totalLoansGiven || 0) + (stats.totalLoansRepaid || 0));
    const outstandingLoansBdt = ((stats.totalLoansTakenBdt || 0) + (stats.totalLoansCollectedBdt || 0)) - ((stats.totalLoansGivenBdt || 0) + (stats.totalLoansRepaidBdt || 0));

    return NextResponse.json({
      ...stats,
      netBalance,
      netBalanceBdt,
      outstandingLoans,
      outstandingLoansBdt
    });
  } catch (error: any) {
    console.error("Fetch finance summary error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
