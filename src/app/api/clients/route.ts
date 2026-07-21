import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import { clientSchema } from '@/lib/validations';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const status = searchParams.get('status');

    const query: any = {};
    if (source && source !== 'All') {
      query.source = source;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { number: { $regex: search, $options: 'i' } },
        { socialMediaLink: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { otherSource: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("Fetch clients error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const parseResult = clientSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const clientData = parseResult.data;

    const newClient = new Client(clientData);
    await newClient.save();

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
