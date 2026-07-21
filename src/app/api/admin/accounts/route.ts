import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || 'all';
  
  const skip = (page - 1) * limit;

  try {
    await dbConnect();

    // Aggregation pipeline to unwind accounts and paginate
    const pipeline: any[] = [
      // Only get users that have at least one account
      { $match: { accounts: { $exists: true, $not: { $size: 0 } } } },
      
      // Unwind the accounts array so each account becomes a separate document
      { $unwind: "$accounts" },
    ];

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

    // Sort accounts (e.g. by providerName)
    pipeline.push({ $sort: { "accounts.providerName": 1, "name": 1 } });

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
              account: "$accounts"
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
