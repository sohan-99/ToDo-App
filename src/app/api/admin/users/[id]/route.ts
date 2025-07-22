import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { UserRole, AdminPermissions } from '@/models/user.interface';
interface Params {
  params: {
    id: string;
  };
}
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    await connectToDatabase();
    const currentAdmin =
      session.user.role === 'admin' ? await UserModel.findById(session.user.id) : null;
    const adminPermissions = currentAdmin?.adminPermissions as AdminPermissions | undefined;
    const {
      role,
      name,
      email,
      adminPermissions: newAdminPermissions,
    } = (await req.json()) as {
      role?: UserRole;
      name?: string;
      email?: string;
      adminPermissions?: AdminPermissions;
    };
    if (role && !['user', 'admin', 'super-admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }
    const userToUpdate = await UserModel.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const updateData: {
      role?: UserRole;
      name?: string;
      email?: string;
      adminPermissions?: AdminPermissions | null;
      $unset?: { adminPermissions?: string };
    } = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role === 'admin') {
      updateData.adminPermissions = newAdminPermissions || {
        canUpdateUserInfo: true,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canDemoteAdmins: false,
      };
    } else if (role === 'user' || role === 'super-admin') {
      updateData.$unset = { adminPermissions: '' };
    }
    if (!role && userToUpdate.role === 'admin' && newAdminPermissions) {
      updateData.adminPermissions = newAdminPermissions;
    }
    if (session.user.role === 'super-admin') {
    } else if (session.user.role === 'admin') {
      if ((name || email) && (!adminPermissions || !adminPermissions.canUpdateUserInfo)) {
        return NextResponse.json(
          {
            error: 'You do not have permission to update user information',
          },
          { status: 403 }
        );
      }
      if (role) {
        if (role === 'admin' && userToUpdate.role === 'user') {
        } else if (role === 'user' && userToUpdate.role === 'admin') {
          if (!adminPermissions?.canDemoteAdmins) {
            return NextResponse.json(
              {
                error: 'You do not have permission to demote admins',
              },
              { status: 403 }
            );
          }
        } else if (role === 'super-admin') {
          return NextResponse.json(
            {
              error: 'Only super-admins can promote users to super-admin',
            },
            { status: 403 }
          );
        }
      }
      if (newAdminPermissions) {
        if (userToUpdate.role !== 'admin' && !adminPermissions?.canPromoteToAdmin) {
          return NextResponse.json(
            {
              error: 'You do not have permission to update admin permissions',
            },
            { status: 403 }
          );
        }
      }
      if (userToUpdate.role !== 'user') {
        return NextResponse.json(
          {
            error: 'Regular admins can only update regular users',
          },
          { status: 403 }
        );
      }
    }
    if (updateData.$unset) {
      await UserModel.updateOne({ _id: userId }, { $unset: updateData.$unset });
      delete updateData.$unset;
    }
    const user = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: '-password',
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    await connectToDatabase();
    const currentAdmin =
      session.user.role === 'admin' ? await UserModel.findById(session.user.id) : null;
    const adminPermissions = currentAdmin?.adminPermissions as AdminPermissions | undefined;
    const userToDelete = await UserModel.findById(userId);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (userToDelete.role === 'super-admin' && session.user.role !== 'super-admin') {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete a super-admin user',
        },
        { status: 403 }
      );
    }
    if (userId === session.user.id) {
      return NextResponse.json(
        {
          error: 'You cannot delete your own account',
        },
        { status: 400 }
      );
    }
    if (session.user.role === 'admin') {
      if (!adminPermissions || !adminPermissions.canDeleteUsers) {
        return NextResponse.json(
          {
            error: 'You do not have permission to delete users',
          },
          { status: 403 }
        );
      }
      if (userToDelete.role !== 'user') {
        return NextResponse.json(
          {
            error: `As an Admin, you can only delete regular users, not ${userToDelete.role}s`,
          },
          { status: 403 }
        );
      }
    }
    await UserModel.findByIdAndDelete(userId);
    return NextResponse.json({
      message: `User deleted successfully`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
