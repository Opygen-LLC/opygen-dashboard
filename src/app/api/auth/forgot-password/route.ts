import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security, do not disclose if email exists or not.
    // Return standard success response.
    const successResponse = NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been dispatched.',
    });

    if (!user) {
      return successResponse;
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600 * 1000); // Valid for 1 hour

    // Store token and expiration (in plain format, or hashed)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Construct the reset url link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send the password reset email
    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password | OpyDash',
      templateName: 'reset-password',
      templateData: {
        name: user.name,
        resetUrl,
      },
    });

    return successResponse;
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
