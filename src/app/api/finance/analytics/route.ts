import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Project from '@/models/Project';
import Quote from '@/models/Quote';
import { TransactionType } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const User = (await import('@/models/User')).default;

    const now = new Date();
    
    // 1. Month-over-Month Trends (Past 6 Months) in USD & BDT
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0]
            }
          },
          incomeBdt: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, { $ifNull: ["$amountInBdt", 0] }, 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
            }
          },
          expenseBdt: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, { $ifNull: ["$amountInBdt", 0] }, 0]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Build complete array for last 6 months even if some months have 0 transactions
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlyStats.find(s => s._id.year === year && s._id.month === month);
      
      const income = found ? found.income : 0;
      const incomeBdt = found ? found.incomeBdt : 0;
      const expense = found ? found.expense : 0;
      const expenseBdt = found ? found.expenseBdt : 0;
      const profit = income - expense;
      const profitBdt = incomeBdt - expenseBdt;

      monthlyTrends.push({
        month: `${monthNames[d.getMonth()]} ${year.toString().slice(-2)}`,
        income,
        incomeBdt,
        expense,
        expenseBdt,
        profit,
        profitBdt
      });
    }

    // 2. Category Breakdown for Expenses (USD and BDT)
    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          type: TransactionType.EXPENSE
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          totalBdt: { $sum: { $ifNull: ["$amountInBdt", 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const categoryBreakdown = categoryStats.map(c => ({
      category: c._id ? c._id.replace(/_/g, ' ').toUpperCase() : 'OTHER',
      amount: c.total,
      amountBdt: c.totalBdt
    }));

    // 3. Trailing 90-Day Burn Rate calculation (USD and BDT)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const trailingExpenses = await Transaction.aggregate([
      {
        $match: {
          type: TransactionType.EXPENSE,
          date: { $gte: ninetyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          totalBdt: { $sum: { $ifNull: ["$amountInBdt", 0] } }
        }
      }
    ]);
    
    const trailing90ExpenseTotal = trailingExpenses[0]?.total || 0;
    const trailing90ExpenseTotalBdt = trailingExpenses[0]?.totalBdt || 0;
    const monthlyBurnRate = trailing90ExpenseTotal > 0 ? trailing90ExpenseTotal / 3 : 0;
    const monthlyBurnRateBdt = trailing90ExpenseTotalBdt > 0 ? trailing90ExpenseTotalBdt / 3 : 0;

    // 4. Project Profitability
    const projects = await Project.find({}).lean();
    const projectProfitability = projects.map(p => {
      const paidPayments = p.payments ? p.payments.filter(pay => pay.status === 'paid') : [];
      const pendingPayments = p.payments ? p.payments.filter(pay => pay.status === 'pending') : [];

      const revenueCollected = paidPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
      const pendingRevenue = pendingPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
      
      const totalBudget = p.budget || (p.budgetMax ? p.budgetMax : 0);
      const directCosts = 0;
      const profit = revenueCollected - directCosts;
      const margin = revenueCollected > 0 ? Math.round((profit / revenueCollected) * 100) : 0;

      return {
        id: p._id.toString(),
        title: p.title,
        clientName: p.clientName || 'N/A',
        status: p.status,
        budget: totalBudget,
        revenueCollected,
        pendingRevenue,
        profit,
        margin
      };
    }).sort((a, b) => b.revenueCollected - a.revenueCollected).slice(0, 10);

    // 5. Cash Flow Forecast (30, 60, 90 Days) in USD & BDT
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let inflow30 = 0;
    let inflow60 = 0;
    let inflow90 = 0;

    projects.forEach(p => {
      if (p.payments && Array.isArray(p.payments)) {
        p.payments.filter(pay => pay.status === 'pending').forEach(pay => {
          const dueDate = p.dueDate ? new Date(p.dueDate) : now;
          if (dueDate <= in30Days) {
            inflow30 += pay.amount || 0;
          } else if (dueDate <= in60Days) {
            inflow60 += pay.amount || 0;
          } else if (dueDate <= in90Days) {
            inflow90 += pay.amount || 0;
          } else {
            inflow30 += (pay.amount || 0) * 0.5;
          }
        });
      }
    });

    const quotes = await Quote.find({}).lean();
    quotes.forEach(q => {
      if (q.advanceValue) {
        if (q.advanceType === 'fixed') {
          inflow30 += q.advanceValue;
        } else {
          const totalPhaseMax = (q.phases || []).reduce((acc: number, ph: any) => acc + (ph.maxBudget || 0), 0);
          inflow30 += (totalPhaseMax * q.advanceValue) / 100;
        }
      }
    });

    // Approximate USD to BDT exchange rate based on overall ratio (~122)
    const usdToBdtRate = 122;

    const cashFlowForecast = [
      {
        horizon: "30 Days",
        projectedInflow: Math.round(inflow30),
        projectedInflowBdt: Math.round(inflow30 * usdToBdtRate),
        projectedOutflow: Math.round(monthlyBurnRate),
        projectedOutflowBdt: Math.round(monthlyBurnRateBdt || monthlyBurnRate * usdToBdtRate),
        netCashFlow: Math.round(inflow30 - monthlyBurnRate),
        netCashFlowBdt: Math.round(inflow30 * usdToBdtRate - (monthlyBurnRateBdt || monthlyBurnRate * usdToBdtRate))
      },
      {
        horizon: "60 Days",
        projectedInflow: Math.round(inflow30 + inflow60),
        projectedInflowBdt: Math.round((inflow30 + inflow60) * usdToBdtRate),
        projectedOutflow: Math.round(monthlyBurnRate * 2),
        projectedOutflowBdt: Math.round((monthlyBurnRateBdt || monthlyBurnRate * usdToBdtRate) * 2),
        netCashFlow: Math.round((inflow30 + inflow60) - (monthlyBurnRate * 2)),
        netCashFlowBdt: Math.round((inflow30 + inflow60) * usdToBdtRate - (monthlyBurnRateBdt || monthlyBurnRate * usdToBdtRate) * 2)
      },
      {
        horizon: "90 Days",
        projectedInflow: Math.round(inflow30 + inflow60 + inflow90),
        projectedInflowBdt: Math.round((inflow30 + inflow60 + inflow90) * usdToBdtRate),
        projectedOutflow: Math.round(monthlyBurnRate * 3),
        projectedOutflowBdt: Math.round((monthlyBurnRateBdt || monthlyBurnRate * usdToBdtRate) * 3),
        netCashFlow: Math.round((inflow30 + inflow60 + inflow90) - (monthlyBurnRate * 3)),
        netCashFlowBdt: Math.round((inflow30 + inflow60 + inflow90) * usdToBdtRate - (monthlyBurnRateBdt || monthlyBurnRate * usdToBdtRate) * 3)
      }
    ];

    // 6. Account Balances breakdown across all users
    const accountBalances = await User.aggregate([
      { $match: { accounts: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$accounts" },
      {
        $project: {
          _id: "$accounts._id",
          userId: "$_id",
          userName: "$name",
          userEmail: "$email",
          userAvatar: "$avatarUrl",
          providerName: "$accounts.providerName",
          accountName: "$accounts.accountName",
          accountNumber: "$accounts.accountNumber",
          type: "$accounts.type",
          branch: "$accounts.branch",
          routingNumber: "$accounts.routingNumber",
          balance: { $ifNull: ["$accounts.balance", 0] },
          balanceInBdt: { $ifNull: ["$accounts.balanceInBdt", 0] },
        }
      },
      { $sort: { balanceInBdt: -1, balance: -1 } }
    ]);

    // Compute total net profit & overall margin for summary deck (both USD & BDT)
    const totalIncomeAll = monthlyTrends.reduce((acc, m) => acc + m.income, 0);
    const totalIncomeAllBdt = monthlyTrends.reduce((acc, m) => acc + m.incomeBdt, 0);
    const totalExpenseAll = monthlyTrends.reduce((acc, m) => acc + m.expense, 0);
    const totalExpenseAllBdt = monthlyTrends.reduce((acc, m) => acc + m.expenseBdt, 0);
    const netProfitOverall = totalIncomeAll - totalExpenseAll;
    const netProfitOverallBdt = totalIncomeAllBdt - totalExpenseAllBdt;
    const profitMarginOverall = totalIncomeAll > 0 ? Math.round((netProfitOverall / totalIncomeAll) * 100) : 0;

    return NextResponse.json({
      monthlyTrends,
      categoryBreakdown,
      projectProfitability,
      cashFlowForecast,
      accountBalances,
      summaryMetrics: {
        totalIncome6M: totalIncomeAll,
        totalIncome6MBdt: totalIncomeAllBdt,
        totalExpense6M: totalExpenseAll,
        totalExpense6MBdt: totalExpenseAllBdt,
        netProfit6M: netProfitOverall,
        netProfit6MBdt: netProfitOverallBdt,
        profitMargin6M: profitMarginOverall,
        monthlyBurnRate: Math.round(monthlyBurnRate),
        monthlyBurnRateBdt: Math.round(monthlyBurnRateBdt)
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch financial analytics', details: error.message }, { status: 500 });
  }
}
