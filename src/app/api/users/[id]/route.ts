import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { UserRole, UserStatus } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot demote or block your own administrator account.' }, { status: 400 });
    }

    const { role, status, mobileNumber } = await req.json();
    const updateData: any = {};

    if (role !== undefined) {
      if (!Object.values(UserRole).includes(role as UserRole)) {
        return NextResponse.json({ error: 'Valid role is required.' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (status !== undefined) {
      if (!Object.values(UserStatus).includes(status as UserStatus)) {
        return NextResponse.json({ error: 'Valid status is required.' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (mobileNumber !== undefined) {
      updateData.mobileNumber = mobileNumber;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully.',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error: any) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    if (session.user.id === id) {
      return NextResponse.json({ error: 'Safety Guard: You cannot delete your own account.' }, { status: 400 });
    }

    await dbConnect();

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
