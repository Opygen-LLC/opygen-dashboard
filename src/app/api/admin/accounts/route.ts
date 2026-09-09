import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || ((session.user.role as string) !== 'admin' && (session.user.role as string) !== 'superadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || 'all';
  const userId = searchParams.get('userId') || 'all';
  const sortBy = searchParams.get('sortBy') || 'default';
  
  const skip = (page - 1) * limit;

  try {
    await dbConnect();

    // Aggregation pipeline to unwind accounts and paginate
    const pipeline: any[] = [
      // Only get users that have at least one account
      { $match: { accounts: { $exists: true, $not: { $size: 0 } } } },
    ];

    // Filter by user if provided and not 'all'
    if (userId && userId !== 'all' && mongoose.Types.ObjectId.isValid(userId)) {
      pipeline.push({
        $match: {
          _id: new mongoose.Types.ObjectId(userId)
        }
      });
    }

    // Unwind the accounts array so each account becomes a separate document
    pipeline.push({ $unwind: "$accounts" });

    // Filter by type if provided and not 'all'
    if (type !== 'all') {
      pipeline.push({
        $match: {
          "accounts.type": type
        }
      });
    }

    // Search matching if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { "name": searchRegex },
            { "email": searchRegex },
            { "accounts.providerName": searchRegex },
            { "accounts.accountName": searchRegex },
            { "accounts.accountNumber": searchRegex },
            { "accounts.type": searchRegex },
          ]
        }
      });
    }

    // Sort accounts
    if (sortBy === 'price_desc' || sortBy === 'balance_desc') {
      pipeline.push({ $sort: { "accounts.balance": -1, "accounts.balanceInBdt": -1 } });
    } else if (sortBy === 'price_asc' || sortBy === 'balance_asc') {
      pipeline.push({ $sort: { "accounts.balance": 1, "accounts.balanceInBdt": 1 } });
    } else if (sortBy === 'price_bdt_desc' || sortBy === 'balance_bdt_desc') {
      pipeline.push({ $sort: { "accounts.balanceInBdt": -1, "accounts.balance": -1 } });
    } else if (sortBy === 'price_bdt_asc' || sortBy === 'balance_bdt_asc') {
      pipeline.push({ $sort: { "accounts.balanceInBdt": 1, "accounts.balance": 1 } });
    } else {
      pipeline.push({ $sort: { "accounts.providerName": 1, "name": 1 } });
    }

    // Pagination using facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          // Project only the necessary fields
          {
            $project: {
              _id: 0,
              userId: "$_id",
              userName: "$name",
              userEmail: "$email",
              userAvatar: "$avatarUrl",
              account: {
                _id: "$accounts._id",
                type: "$accounts.type",
                providerName: "$accounts.providerName",
                accountName: "$accounts.accountName",
                accountNumber: "$accounts.accountNumber",
                routingNumber: "$accounts.routingNumber",
                branch: "$accounts.branch",
                balance: { $ifNull: ["$accounts.balance", 0] },
                balanceInBdt: { $ifNull: ["$accounts.balanceInBdt", 0] }
              }
            }
          }
        ]
      }
    });

    const result = await User.aggregate(pipeline);
    
    const accountsData = result[0].data || [];
    const total = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      accounts: accountsData,
      total,
      page,
      totalPages,
      limit
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
