import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hashPassword } from '@/lib/auth';

// GET /api/users/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's information, excluding the password
    const user = await UserModel.findById(session.user.id).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user profile';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/users/profile - Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get current user
    const currentUser = await UserModel.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const { name, email, currentPassword, newPassword } = (await req.json()) as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
    } = {};

    // Validate and include name if provided
    if (name) {
      if (name.length > 60) {
        return NextResponse.json(
          { error: 'Name cannot be more than 60 characters' },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    // Validate and include email if provided
    if (email && email !== currentUser.email) {
      // Check if email is already in use
      const existingUser = await UserModel.findOne({ email });
      if (existingUser && existingUser._id.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
      }
      updateData.email = email;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      // Verify current password
      const { verifyPassword } = await import('@/lib/auth');
      const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.password);

      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      try {
        // Hash the new password
        updateData.password = await hashPassword(newPassword);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid password';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    }

    // If there are no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes to update' }, { status: 200 });
    }

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(session.user.id, updateData, {
      new: true,
      select: '-password',
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
