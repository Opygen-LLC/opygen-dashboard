import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Statement from '@/models/Statements';
import { transactionSchema } from '@/lib/validations';
import User from '@/models/User';

const STATEMENT_CATEGORIES = ['salary', 'loan_taken', 'loan_given', 'loan_repayment'];

function getStmtType(category: string): '+' | '-' {
  return category === 'loan_taken' ? '-' : '+';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    // Ensure User model is registered for population
    if (!User) console.warn('User model not loaded');

    const body = await req.json();

    const parseResult = transactionSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const originalTx = await Transaction.findById(id);
    if (!originalTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Perform the update
    const transaction = await Transaction.findByIdAndUpdate(id, parseResult.data, { new: true })
      .populate('user', 'name email avatarUrl');

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found after update' }, { status: 404 });
    }

    const newUserId = transaction.user
      ? (transaction.user._id ? transaction.user._id.toString() : transaction.user.toString())
      : null;

    // ── STATEMENT SYNC ──────────────────────────────────────────────────────
    // The Statement model's post-save hooks handle all balance updates automatically.
    // We just need to upsert/delete the statement correctly.

    const existingStatement = await Statement.findOne({ transaction: id });

    if (newUserId && STATEMENT_CATEGORIES.includes(transaction.category)) {
      const stmtType = getStmtType(transaction.category);

      if (existingStatement) {
        // Update existing statement — hook will diff the balance automatically
        existingStatement.user = newUserId as any;
        existingStatement.amount = transaction.amount;
        existingStatement.type = stmtType;
        existingStatement.category = transaction.category;
        existingStatement.description = transaction.description;
        existingStatement.date = transaction.date || new Date();
        await existingStatement.save(); // triggers pre/post save hooks → balance auto-updated
      } else {
        // Create new statement — post-save hook will add to balance
        await Statement.create({
          user: newUserId,
          transaction: transaction._id,
          amount: transaction.amount,
          type: stmtType,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date || new Date(),
        });
      }
    } else if (existingStatement) {
      // Category changed away from statement type — delete statement
      // post findOneAndDelete hook will revert the balance
      await Statement.findOneAndDelete({ transaction: id });
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(id);

    // Delete associated statement — findOneAndDelete hook auto-reverts the balance
    await Statement.findOneAndDelete({ transaction: id });

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
