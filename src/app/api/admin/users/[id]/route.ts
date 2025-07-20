import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@/models/user.interface';


interface Params {
  params: {
    id: string;
  };
}

// PUT /api/admin/users/:id - Update a user role
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    // Check authentication and proper permissions
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { role } = await req.json() as { role: UserRole };

    // Validate requested role
    if (!role || !['user', 'admin', 'super-admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    // Apply role-based permissions
    if (session.user.role === 'super-admin') {
      // Super Admin can promote to any role
      // No restrictions for super-admin
    } else if (session.user.role === 'admin') {
      // Admins cannot promote users at all - they can only manage regular users
      return NextResponse.json({
        error: 'Regular admins do not have permission to change user roles'
      }, { status: 403 });
    }

    await connectToDatabase();

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password' }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/admin/users/:id - Delete a user
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    // Check authentication and proper permissions
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user to delete is a super-admin
    const userToDelete = await UserModel.findById(userId);

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only super-admins can delete other super-admins
    if (userToDelete.role === 'super-admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({
        error: 'You do not have permission to delete a super-admin user'
      }, { status: 403 });
    }

    // Don't allow users to delete themselves
    if (userId === session.user.id) {
      return NextResponse.json({
        error: 'You cannot delete your own account'
      }, { status: 400 });
    }

    // Check role-based permissions:
    // 1. Admin can only delete regular users
    // 2. Super Admin can delete anyone
    if (session.user.role === 'admin' && userToDelete.role !== 'user') {
      return NextResponse.json({
        error: `As an Admin, you can only delete regular users, not ${userToDelete.role}s`
      }, { status: 403 });
    }

    await UserModel.findByIdAndDelete(userId);

    return NextResponse.json({
      message: `User deleted successfully`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
