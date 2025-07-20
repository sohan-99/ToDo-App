import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// GET /api/admin/users - Get all users
export async function GET() {
  try {
    const session = await auth();

    // Check authentication and proper permissions
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();

    // If super-admin, show all users without filtering
    // If regular admin, you could add filters here if needed in the future
    const users = await UserModel.find(
      {},
      {
        password: 0, // Exclude password field
      }
    ).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/admin/users/delete - Delete multiple users
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and proper permissions
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userIds } = (await req.json()) as { userIds: string[] };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check users to be deleted based on role permissions
    const usersToDelete = await UserModel.find({ _id: { $in: userIds } });

    // Admin role restrictions
    if (session.user.role === 'admin') {
      // Get admin's permissions
      const currentAdmin = await UserModel.findById(session.user.id);

      // Check if admin has delete permission
      if (!currentAdmin?.adminPermissions?.canDeleteUsers) {
        return NextResponse.json(
          {
            error: 'You do not have permission to delete users',
          },
          { status: 403 }
        );
      }

      // Even with delete permission, check if trying to delete admin or super-admin users
      const hasNonRegularUsers = usersToDelete.some(
        user => user.role === 'admin' || user.role === 'super-admin'
      );

      if (hasNonRegularUsers) {
        return NextResponse.json(
          {
            error: 'As an Admin, you can only delete regular users',
          },
          { status: 403 }
        );
      }
    }

    // Only super-admins can delete super-admins
    const hasSuperAdmin = usersToDelete.some(user => user.role === 'super-admin');
    if (hasSuperAdmin && session.user.role !== 'super-admin') {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete super-admin users',
        },
        { status: 403 }
      );
    }

    // Don't allow deletion of own account
    const isDeletingSelf = usersToDelete.some(user => user._id.toString() === session.user.id);
    if (isDeletingSelf) {
      return NextResponse.json(
        {
          error: 'You cannot delete your own account',
        },
        { status: 400 }
      );
    }

    const result = await UserModel.deleteMany({ _id: { $in: userIds } });

    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
