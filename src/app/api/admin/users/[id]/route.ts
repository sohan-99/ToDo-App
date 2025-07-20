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

    await connectToDatabase();

    // Get current admin's information with permissions
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

    // For role updates, validate the requested role
    if (role && !['user', 'admin', 'super-admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    // Find the user to update
    const userToUpdate = await UserModel.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update object
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

    // Handle admin permissions
    if (role === 'admin') {
      // Set admin permissions if provided, or use defaults if not
      updateData.adminPermissions = newAdminPermissions || {
        canUpdateUserInfo: true,
        canDeleteUsers: false,
      };
    } else if (role === 'user' || role === 'super-admin') {
      // Remove adminPermissions field completely for non-admin roles
      updateData.$unset = { adminPermissions: '' };
    }

    // Handle admin permissions updates for existing admins (without role change)
    if (!role && userToUpdate.role === 'admin' && newAdminPermissions) {
      updateData.adminPermissions = newAdminPermissions;
    }

    // Apply role-based permissions
    if (session.user.role === 'super-admin') {
      // Super Admin can update any user information (role, name, email, permissions)
      // No restrictions for super-admin
    } else if (session.user.role === 'admin') {
      // Check if admin has permission to update user info
      if ((name || email) && (!adminPermissions || !adminPermissions.canUpdateUserInfo)) {
        return NextResponse.json(
          {
            error: 'You do not have permission to update user information',
          },
          { status: 403 }
        );
      }

      // Admins cannot update user roles
      if (role) {
        return NextResponse.json(
          {
            error: 'Regular admins do not have permission to change user roles',
          },
          { status: 403 }
        );
      }

      // Admins cannot update admin permissions
      if (newAdminPermissions) {
        return NextResponse.json(
          {
            error: 'Regular admins do not have permission to update admin permissions',
          },
          { status: 403 }
        );
      }

      // Admins can only update regular users' information
      if (userToUpdate.role !== 'user') {
        return NextResponse.json(
          {
            error: 'Regular admins can only update regular users',
          },
          { status: 403 }
        );
      }
    }

    // For removing fields, we need to use $unset operator directly
    if (updateData.$unset) {
      // If we need to remove fields, handle it separately
      await UserModel.updateOne({ _id: userId }, { $unset: updateData.$unset });
      delete updateData.$unset; // Remove $unset from the updateData
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

    // Get current admin's information with permissions if admin
    const currentAdmin =
      session.user.role === 'admin' ? await UserModel.findById(session.user.id) : null;

    const adminPermissions = currentAdmin?.adminPermissions as AdminPermissions | undefined;

    // Check if user to delete is a super-admin
    const userToDelete = await UserModel.findById(userId);

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only super-admins can delete other super-admins
    if (userToDelete.role === 'super-admin' && session.user.role !== 'super-admin') {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete a super-admin user',
        },
        { status: 403 }
      );
    }

    // Don't allow users to delete themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        {
          error: 'You cannot delete your own account',
        },
        { status: 400 }
      );
    }

    // Check role-based permissions:
    // 1. Admin can only delete regular users if they have the permission
    // 2. Super Admin can delete anyone
    if (session.user.role === 'admin') {
      // Check if admin has delete permission
      if (!adminPermissions || !adminPermissions.canDeleteUsers) {
        return NextResponse.json(
          {
            error: 'You do not have permission to delete users',
          },
          { status: 403 }
        );
      }

      // Even with delete permission, admins can only delete regular users
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
