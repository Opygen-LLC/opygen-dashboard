import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import { clientSchema } from '@/lib/validations';
import { createActivityLog } from '@/lib/activityLogger';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const searchParams = new URL(req.url).searchParams;
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const followupFilter = searchParams.get('followupDate');

    const query: any = {};
    if (source && source !== 'All') {
      query.source = source;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (followupFilter) {
      const targetDate = new Date(followupFilter);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        query.followupDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }
    
    if (search) {
      const cleanSearch = search.trim();
      const digitsOnly = cleanSearch.replace(/\D/g, '');

      const searchConditions: any[] = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { companyName: { $regex: cleanSearch, $options: 'i' } },
        { number: { $regex: cleanSearch, $options: 'i' } },
        { socialMediaLink: { $regex: cleanSearch, $options: 'i' } },
        { country: { $regex: cleanSearch, $options: 'i' } },
        { notes: { $regex: cleanSearch, $options: 'i' } },
        { source: { $regex: cleanSearch, $options: 'i' } },
        { otherSource: { $regex: cleanSearch, $options: 'i' } }
      ];

      if (digitsOnly.length >= 3) {
        searchConditions.push({ number: { $regex: digitsOnly, $options: 'i' } });
      }

      query.$or = searchConditions;
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

    // Uniqueness validation for Phone Number
    if (clientData.number && clientData.number.trim() !== "") {
      const existingNum = await Client.findOne({ number: clientData.number.trim() });
      if (existingNum) {
        return NextResponse.json(
          { error: "A client with this phone number already exists." },
          { status: 400 }
        );
      }
    }

    // Uniqueness validation for Social Media Link
    if (clientData.socialMediaLink && clientData.socialMediaLink.trim() !== "") {
      const existingSocial = await Client.findOne({ socialMediaLink: clientData.socialMediaLink.trim() });
      if (existingSocial) {
        return NextResponse.json(
          { error: "A client with this social media link already exists." },
          { status: 400 }
        );
      }
    }

    const newClient = new Client(clientData);
    await newClient.save();

    await createActivityLog({
      user: session.user.id,
      type: "client_added",
      message: `New client onboarded: ${newClient.name}${newClient.companyName ? ` (${newClient.companyName})` : ''}`,
      targetUrl: "/admin-dashboard/clients"
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error("Create client error:", error);
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0];
      const label = key === 'number' ? 'phone number' : key === 'socialMediaLink' ? 'social media link' : key;
      return NextResponse.json({ error: `A client with this ${label} already exists.` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
