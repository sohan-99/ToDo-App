import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AdminPermissions, UserRole } from '@/models/user.interface';
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
    const body = await req.json();
    if (body.userIds) {
      return await handleBulkDelete(req, session, body.userIds);
    } else if (body.user) {
      return await handleCreateUser(req, session, body.user);
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
async function handleCreateUser(
  req: NextRequest,
  session: { user: { id: string; role: UserRole; adminPermissions?: AdminPermissions } },
  userData: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    adminPermissions?: AdminPermissions;
  }
) {
  try {
    const { name, email, password, role = 'user', adminPermissions } = userData;
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    await connectToDatabase();
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        existingUser._id,
        {
          $set: {
            name,
            role,
            ...(password
              ? { password: await (await import('@/lib/auth')).hashPassword(password) }
              : {}),
            ...(role === 'admin'
              ? {
                  adminPermissions: adminPermissions || {
                    canUpdateUserInfo: true,
                    canDeleteUsers: false,
                    canPromoteToAdmin: true,
                    canDemoteAdmins: false,
                  },
                }
              : {}),
          },
        },
        { new: true }
      ).select('-password');
      return NextResponse.json(
        { message: 'User updated successfully', user: updatedUser },
        { status: 200 }
      );
    }
    if (session.user.role === 'admin') {
      if (role === 'admin') {
      } else if (role === 'super-admin') {
        return NextResponse.json(
          { error: 'Only super-admins can create super-admin users' },
          { status: 403 }
        );
      }
    }
    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);
    const userObject: {
      name: string;
      email: string;
      password: string;
      role: string;
      adminPermissions?: typeof adminPermissions;
    } = {
      name,
      email,
      password: hashedPassword,
      role,
    };
    if (role === 'admin') {
      userObject.adminPermissions = adminPermissions || {
        canUpdateUserInfo: true,
        canDeleteUsers: false,
        canPromoteToAdmin: true,
        canDemoteAdmins: false,
      };
    }
    const user = await UserModel.create(userObject);
    const responseUser = user.toObject();
    delete responseUser.password;
    return NextResponse.json(
      { message: 'User created successfully', user: responseUser },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
async function handleBulkDelete(
  req: NextRequest,
  session: { user: { id: string; role: UserRole; adminPermissions?: AdminPermissions } },
  userIds: string[]
) {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }
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
