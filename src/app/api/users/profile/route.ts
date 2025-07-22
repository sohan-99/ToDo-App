import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hashPassword } from '@/lib/auth';
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const user = await UserModel.findById(session.user.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (_error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user profile';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const currentUser = await UserModel.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { name, email, currentPassword, newPassword } = (await req.json()) as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
    } = {};
    if (name) {
      if (name.length > 60) {
        return NextResponse.json(
          { error: 'Name cannot be more than 60 characters' },
          { status: 400 }
        );
      }
      updateData.name = name;
    }
    if (email && email !== currentUser.email) {
      const existingUser = await UserModel.findOne({ email });
      if (existingUser && existingUser._id.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
      }
      updateData.email = email;
    }
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }
      const { verifyPassword } = await import('@/lib/auth');
      const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      try {
        updateData.password = await hashPassword(newPassword);
      } catch (_error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid password';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes to update' }, { status: 200 });
    }
    const updatedUser = await UserModel.findByIdAndUpdate(session.user.id, updateData, {
      new: true,
      select: '-password',
    });
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (_error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
