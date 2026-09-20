import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Product from '@/models/Product';
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

    if (originalTx.transferGroupId || originalTx.category === 'transfer' || originalTx.category === 'transfer_fee') {
      return NextResponse.json({
        error: 'Transfer transactions cannot be edited directly to preserve balance integrity. Please delete the transfer and create a new one.'
      }, { status: 400 });
    }

    const updateData: any = { ...parseResult.data };
    const effectiveCategory = updateData.category || originalTx.category;

    if (effectiveCategory === 'product') {
      if (updateData.category === 'product') {
        if (!updateData.productName || !updateData.productName.trim()) {
          return NextResponse.json({ error: 'Product name is required when category is Product' }, { status: 400 });
        }
        if (!updateData.productId) {
          const escaped = updateData.productName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const matched = await Product.findOne({
            name: { $regex: new RegExp(`^${escaped}$`, "i") }
          }).lean();
          if (matched) {
            updateData.productId = matched._id.toString();
          }
        }
      }
    } else {
      updateData.productName = null;
      updateData.productId = null;
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

    if (updateData.amount !== undefined) {
      updateData.amount = Number(updateData.amount);
    }

    // Perform the update
    const transaction = await Transaction.findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'name email avatarUrl')
      .populate('accountUser', 'name email avatarUrl');

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found after update' }, { status: 404 });
    }

    // ── ACCOUNT BALANCE SYNC (BDT) ──────────────────────────────────────────
    // Revert old transaction's impact on its account
    if (originalTx.accountUser && originalTx.accountId) {
      const oldIsIncome = originalTx.type === 'income';
      const oldDelta = oldIsIncome ? Number(originalTx.amount || 0) : -Number(originalTx.amount || 0);

      await User.updateOne(
        { _id: originalTx.accountUser, 'accounts._id': originalTx.accountId },
        {
          $inc: {
            'accounts.$.balance': -oldDelta,
            'accounts.$.balanceInBdt': -oldDelta,
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
      const newDelta = newIsIncome ? Number(transaction.amount) : -Number(transaction.amount);

      await User.updateOne(
        { _id: newAccountUserId, 'accounts._id': transaction.accountId },
        {
          $inc: {
            'accounts.$.balance': newDelta,
            'accounts.$.balanceInBdt': newDelta,
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
        const oldUserId = existingStatement.user.toString();

        // Update existing statement
        existingStatement.user = newUserId as any;
        existingStatement.amount = transaction.amount;
        existingStatement.type = stmtType;
        existingStatement.category = transaction.category;
        existingStatement.description = transaction.description;
        existingStatement.date = transaction.date || new Date();
        await existingStatement.save();
        
        // Calculate new balance delta
        const newDelta = stmtType === '+' ? Number(transaction.amount) : -Number(transaction.amount);

        // Apply diffs directly
        if (oldUserId !== newUserId) {
            await User.findByIdAndUpdate(oldUserId, { $inc: { balance: -oldDelta, balanceInBdt: -oldDelta } });
            await User.findByIdAndUpdate(newUserId, { $inc: { balance: newDelta, balanceInBdt: newDelta } });
        } else {
            const diff = newDelta - oldDelta;
            if (diff !== 0) {
                await User.findByIdAndUpdate(newUserId, { $inc: { balance: diff, balanceInBdt: diff } });
            }
        }
      } else {
        // Create new statement
        await Statement.create({
          user: newUserId,
          transaction: transaction._id,
          amount: transaction.amount,
          type: stmtType,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date || new Date(),
        });
        
        const balanceDelta = stmtType === '+' ? Number(transaction.amount) : -Number(transaction.amount);
        await User.findByIdAndUpdate(newUserId, { $inc: { balance: balanceDelta, balanceInBdt: balanceDelta } });
      }
    } else if (existingStatement) {
      // Category changed away from statement type — delete statement
      const oldDelta = existingStatement.type === '+' ? Number(existingStatement.amount) : -Number(existingStatement.amount);
      await Statement.findByIdAndDelete(existingStatement._id);
      await User.findByIdAndUpdate(existingStatement.user, { $inc: { balance: -oldDelta, balanceInBdt: -oldDelta } });
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

    // Handle linked transfer group deletion
    if (transaction.transferGroupId) {
      const groupTransactions = await Transaction.find({ transferGroupId: transaction.transferGroupId });
      for (const tx of groupTransactions) {
        if (tx.accountUser && tx.accountId) {
          const isInc = tx.type === 'income';
          const delta = isInc ? Number(tx.amount || 0) : -Number(tx.amount || 0);
          await User.updateOne(
            { _id: tx.accountUser, 'accounts._id': tx.accountId },
            {
              $inc: {
                'accounts.$.balance': -delta,
                'accounts.$.balanceInBdt': -delta,
              }
            }
          );
        }
        await Transaction.findByIdAndDelete(tx._id);
      }
      return NextResponse.json({ success: true, message: 'Transfer reversed and deleted successfully' });
    }

    // Revert account balance before deletion (BDT)
    if (transaction.accountUser && transaction.accountId) {
      const isIncome = transaction.type === 'income';
      const delta = isIncome ? Number(transaction.amount || 0) : -Number(transaction.amount || 0);

      await User.updateOne(
        { _id: transaction.accountUser, 'accounts._id': transaction.accountId },
        {
          $inc: {
            'accounts.$.balance': -delta,
            'accounts.$.balanceInBdt': -delta,
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
      await Statement.findByIdAndDelete(existingStatement._id);
      await User.findByIdAndUpdate(existingStatement.user, { $inc: { balance: -oldDelta, balanceInBdt: -oldDelta } });
    }

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
