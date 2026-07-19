import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { profileSchema } from '@/lib/validations';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const parseResult = profileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

        const { name, avatarUrl, password, mobileNumber } = parseResult.data;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.name = name;
    
    if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
      if (user.avatarUrl) {
        deleteFromCloudinary(user.avatarUrl).catch(err =>
          console.error("Failed to delete old avatar from Cloudinary:", err)
        );
      }
      user.avatarUrl = avatarUrl;
    }

    if (mobileNumber !== undefined) {
      user.mobileNumber = mobileNumber;
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        mobileNumber: user.mobileNumber,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const user = await User.findById(session.user.id).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
