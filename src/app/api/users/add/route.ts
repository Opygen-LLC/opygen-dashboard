import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { addUserSchema } from '@/lib/validations';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate request inputs using Zod
    const validation = addUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

        const { name, email, role, password, mobileNumber, status } = validation.data;

    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with that email already exists' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with force-change-password requirement
    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      mobileNumber,
      status,
      needPasswordChange: true, // admin created, so force change password is true!
    });

    return NextResponse.json({
      message: 'Co-founder account created successfully.',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Add user API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
