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

    const now = new Date();
    
    // 1. Month-over-Month Trends (Past 6 Months)
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
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0]
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
      const expense = found ? found.expense : 0;
      const profit = income - expense;

      monthlyTrends.push({
        month: `${monthNames[d.getMonth()]} ${year.toString().slice(-2)}`,
        income,
        expense,
        profit
      });
    }

    // 2. Category Breakdown for Expenses
    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          type: TransactionType.EXPENSE
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const categoryBreakdown = categoryStats.map(c => ({
      category: c._id ? c._id.replace(/_/g, ' ').toUpperCase() : 'OTHER',
      amount: c.total
    }));

    // 3. Trailing 90-Day Burn Rate calculation
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
          total: { $sum: "$amount" }
        }
      }
    ]);
    
    const trailing90ExpenseTotal = trailingExpenses[0]?.total || 0;
    const monthlyBurnRate = trailing90ExpenseTotal > 0 ? trailing90ExpenseTotal / 3 : 0;

    // 4. Project Profitability
    const projects = await Project.find({}).lean();
    const projectProfitability = projects.map(p => {
      const paidPayments = p.payments ? p.payments.filter(pay => pay.status === 'paid') : [];
      const pendingPayments = p.payments ? p.payments.filter(pay => pay.status === 'pending') : [];

      const revenueCollected = paidPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
      const pendingRevenue = pendingPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
      
      // Calculate direct costs placeholder or matching project title in transaction descriptions
      const totalBudget = p.budget || (p.budgetMax ? p.budgetMax : 0);
      const directCosts = 0; // Can be enhanced when line item expenses link directly to project
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

    // 5. Cash Flow Forecast (30, 60, 90 Days)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let inflow30 = 0;
    let inflow60 = 0;
    let inflow90 = 0;

    // Sum pending project milestone payments based on due dates or expected schedule
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
            inflow30 += (pay.amount || 0) * 0.5; // fallback split
          }
        });
      }
    });

    // Sum estimated quote advance values
    const quotes = await Quote.find({}).lean();
    quotes.forEach(q => {
      if (q.advanceValue) {
        if (q.advanceType === 'fixed') {
          inflow30 += q.advanceValue;
        } else {
          // percentage based on max budget in phases
          const totalPhaseMax = (q.phases || []).reduce((acc, ph) => acc + (ph.maxBudget || 0), 0);
          inflow30 += (totalPhaseMax * q.advanceValue) / 100;
        }
      }
    });

    const cashFlowForecast = [
      {
        horizon: "30 Days",
        projectedInflow: Math.round(inflow30),
        projectedOutflow: Math.round(monthlyBurnRate),
        netCashFlow: Math.round(inflow30 - monthlyBurnRate)
      },
      {
        horizon: "60 Days",
        projectedInflow: Math.round(inflow30 + inflow60),
        projectedOutflow: Math.round(monthlyBurnRate * 2),
        netCashFlow: Math.round((inflow30 + inflow60) - (monthlyBurnRate * 2))
      },
      {
        horizon: "90 Days",
        projectedInflow: Math.round(inflow30 + inflow60 + inflow90),
        projectedOutflow: Math.round(monthlyBurnRate * 3),
        netCashFlow: Math.round((inflow30 + inflow60 + inflow90) - (monthlyBurnRate * 3))
      }
    ];

    // Compute total net profit & overall margin for summary deck
    const totalIncomeAll = monthlyTrends.reduce((acc, m) => acc + m.income, 0);
    const totalExpenseAll = monthlyTrends.reduce((acc, m) => acc + m.expense, 0);
    const netProfitOverall = totalIncomeAll - totalExpenseAll;
    const profitMarginOverall = totalIncomeAll > 0 ? Math.round((netProfitOverall / totalIncomeAll) * 100) : 0;

    return NextResponse.json({
      monthlyTrends,
      categoryBreakdown,
      projectProfitability,
      cashFlowForecast,
      summaryMetrics: {
        totalIncome6M: totalIncomeAll,
        totalExpense6M: totalExpenseAll,
        netProfit6M: netProfitOverall,
        profitMargin6M: profitMarginOverall,
        monthlyBurnRate: Math.round(monthlyBurnRate)
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
