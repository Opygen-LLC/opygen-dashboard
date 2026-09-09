import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Statement from '@/models/Statements';
import { transactionSchema } from '@/lib/validations';
import User from '@/models/User';

const STATEMENT_CATEGORIES = ['salary', 'allowance', 'loan_taken', 'loan_collected', 'loan_given', 'loan_repayment'];

function getStmtType(category: string): '+' | '-' {
  return (category === 'loan_taken' || category === 'loan_collected') ? '-' : '+';
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

    const updateData: any = { ...parseResult.data };
    const effectiveCategory = updateData.category || originalTx.category;

    if (effectiveCategory === 'product') {
      if (updateData.category === 'product' && !updateData.productName && !originalTx.productName) {
        return NextResponse.json({ error: 'Product name is required when category is Product' }, { status: 400 });
      }
    } else {
      updateData.productName = null;
    }

    // If account was changed or provided, snapshot new accountDetails
    if (updateData.accountUser && updateData.accountId) {
      const owner = await User.findById(updateData.accountUser);
      const acc = owner?.accounts?.find((a: any) => a._id?.toString() === updateData.accountId);
      if (acc) {
        updateData.accountDetails = {
          providerName: acc.providerName,
          accountName: acc.accountName,
          accountNumber: acc.accountNumber,
          type: acc.type,
          branch: acc.branch,
          routingNumber: acc.routingNumber,
        };
      }
    }

    // Perform the update
    const transaction = await Transaction.findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'name email avatarUrl')
      .populate('accountUser', 'name email avatarUrl');

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found after update' }, { status: 404 });
    }

    // ── ACCOUNT BALANCE SYNC ────────────────────────────────────────────────
    // Revert old transaction's impact on its account
    if (originalTx.accountUser && originalTx.accountId) {
      const oldIsIncome = originalTx.type === 'income';
      const oldDeltaUsd = oldIsIncome ? Number(originalTx.amount) : -Number(originalTx.amount);
      const oldDeltaBdt = oldIsIncome ? Number(originalTx.amountInBdt || 0) : -Number(originalTx.amountInBdt || 0);

      await User.updateOne(
        { _id: originalTx.accountUser, 'accounts._id': originalTx.accountId },
        {
          $inc: {
            'accounts.$.balance': -oldDeltaUsd,
            'accounts.$.balanceInBdt': -oldDeltaBdt,
          }
        }
      );
    }

    // Apply new transaction's impact on updated account
    if (transaction.accountUser && transaction.accountId) {
      const newAccountUserId = transaction.accountUser._id
        ? transaction.accountUser._id.toString()
        : transaction.accountUser.toString();
      const newIsIncome = transaction.type === 'income';
      const newDeltaUsd = newIsIncome ? Number(transaction.amount) : -Number(transaction.amount);
      const newDeltaBdt = newIsIncome ? Number(transaction.amountInBdt || 0) : -Number(transaction.amountInBdt || 0);

      await User.updateOne(
        { _id: newAccountUserId, 'accounts._id': transaction.accountId },
        {
          $inc: {
            'accounts.$.balance': newDeltaUsd,
            'accounts.$.balanceInBdt': newDeltaBdt,
          }
        }
      );
    }

    const newUserId = transaction.user
      ? (transaction.user._id ? transaction.user._id.toString() : transaction.user.toString())
      : null;

    // ── STATEMENT SYNC ──────────────────────────────────────────────────────
    const existingStatement = await Statement.findOne({ transaction: id });

    if (newUserId && STATEMENT_CATEGORIES.includes(transaction.category)) {
      const stmtType = getStmtType(transaction.category);

      if (existingStatement) {
        // Calculate old balance delta
        const oldDelta = existingStatement.type === '+' ? Number(existingStatement.amount) : -Number(existingStatement.amount);
        const oldBdtDelta = existingStatement.type === '+' ? Number(existingStatement.amountInBdt || 0) : -Number(existingStatement.amountInBdt || 0);
        const oldUserId = existingStatement.user.toString();

        // Update existing statement
        existingStatement.user = newUserId as any;
        existingStatement.amount = transaction.amount;
        existingStatement.amountInBdt = transaction.amountInBdt || 0;
        existingStatement.type = stmtType;
        existingStatement.category = transaction.category;
        existingStatement.description = transaction.description;
        existingStatement.date = transaction.date || new Date();
        await existingStatement.save();
        
        // Calculate new balance delta
        const newDelta = stmtType === '+' ? Number(transaction.amount) : -Number(transaction.amount);
        const newBdtDelta = stmtType === '+' ? Number(transaction.amountInBdt || 0) : -Number(transaction.amountInBdt || 0);

        // Apply diffs directly
        if (oldUserId !== newUserId) {
            await User.findByIdAndUpdate(oldUserId, { $inc: { balance: -oldDelta, balanceInBdt: -oldBdtDelta } });
            await User.findByIdAndUpdate(newUserId, { $inc: { balance: newDelta, balanceInBdt: newBdtDelta } });
        } else {
            const diff = newDelta - oldDelta;
            const bdtDiff = newBdtDelta - oldBdtDelta;
            if (diff !== 0 || bdtDiff !== 0) {
                await User.findByIdAndUpdate(newUserId, { $inc: { balance: diff, balanceInBdt: bdtDiff } });
            }
        }
      } else {
        // Create new statement
        await Statement.create({
          user: newUserId,
          transaction: transaction._id,
          amount: transaction.amount,
          amountInBdt: transaction.amountInBdt || 0,
          type: stmtType,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date || new Date(),
        });
        
        const balanceDelta = stmtType === '+' ? Number(transaction.amount) : -Number(transaction.amount);
        const balanceBdtDelta = stmtType === '+' ? Number(transaction.amountInBdt || 0) : -Number(transaction.amountInBdt || 0);
        await User.findByIdAndUpdate(newUserId, { $inc: { balance: balanceDelta, balanceInBdt: balanceBdtDelta } });
      }
    } else if (existingStatement) {
      // Category changed away from statement type — delete statement
      const oldDelta = existingStatement.type === '+' ? Number(existingStatement.amount) : -Number(existingStatement.amount);
      const oldBdtDelta = existingStatement.type === '+' ? Number(existingStatement.amountInBdt || 0) : -Number(existingStatement.amountInBdt || 0);
      await Statement.findByIdAndDelete(existingStatement._id);
      await User.findByIdAndUpdate(existingStatement.user, { $inc: { balance: -oldDelta, balanceInBdt: -oldBdtDelta } });
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

    // Revert account balance before deletion
    if (transaction.accountUser && transaction.accountId) {
      const isIncome = transaction.type === 'income';
      const deltaUsd = isIncome ? Number(transaction.amount) : -Number(transaction.amount);
      const deltaBdt = isIncome ? Number(transaction.amountInBdt || 0) : -Number(transaction.amountInBdt || 0);

      await User.updateOne(
        { _id: transaction.accountUser, 'accounts._id': transaction.accountId },
        {
          $inc: {
            'accounts.$.balance': -deltaUsd,
            'accounts.$.balanceInBdt': -deltaBdt,
          }
        }
      );
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(id);

    // Delete associated statement and explicitly revert the personal user balance
    const existingStatement = await Statement.findOne({ transaction: id });
    if (existingStatement) {
      const oldDelta = existingStatement.type === '+' ? Number(existingStatement.amount) : -Number(existingStatement.amount);
      const oldBdtDelta = existingStatement.type === '+' ? Number(existingStatement.amountInBdt || 0) : -Number(existingStatement.amountInBdt || 0);
      await Statement.findByIdAndDelete(existingStatement._id);
      await User.findByIdAndUpdate(existingStatement.user, { $inc: { balance: -oldDelta, balanceInBdt: -oldBdtDelta } });
    }

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
