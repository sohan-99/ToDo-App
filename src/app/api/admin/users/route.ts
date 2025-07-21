import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();

    const users = await UserModel.find(
      {},
      {
        password: 0,
      }
    ).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userIds } = (await req.json()) as { userIds: string[] };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    await connectToDatabase();

    const usersToDelete = await UserModel.find({ _id: { $in: userIds } });

    if (session.user.role === 'admin') {
      const currentAdmin = await UserModel.findById(session.user.id);

      if (!currentAdmin?.adminPermissions?.canDeleteUsers) {
        return NextResponse.json(
          {
            error: 'You do not have permission to delete users',
          },
          { status: 403 }
        );
      }

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

    const hasSuperAdmin = usersToDelete.some(user => user.role === 'super-admin');
    if (hasSuperAdmin && session.user.role !== 'super-admin') {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete super-admin users',
        },
        { status: 403 }
      );
    }

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
