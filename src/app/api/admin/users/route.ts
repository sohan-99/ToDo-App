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

    // Check if this is a bulk delete operation or a user creation operation
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

// Function to handle user creation by admins
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

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      // If the user wants to create an existing user, update the user instead
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
                    canPromoteToAdmin: false,
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

    // Get current admin's information with permissions
    const currentAdmin =
      session.user.role === 'admin' ? await UserModel.findById(session.user.id) : null;

    const adminPerms = currentAdmin?.adminPermissions;

    // Check permissions based on the role being assigned
    if (session.user.role === 'admin') {
      // Admins can only create regular users by default
      if (role === 'admin') {
        // Check if the admin has permission to promote users to admin
        if (!adminPerms?.canPromoteToAdmin) {
          return NextResponse.json(
            { error: 'You do not have permission to create admin users' },
            { status: 403 }
          );
        }
      } else if (role === 'super-admin') {
        // Regular admins can never create super-admin users
        return NextResponse.json(
          { error: 'Only super-admins can create super-admin users' },
          { status: 403 }
        );
      }
    }

    // Import hash function
    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);

    // Prepare user object
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

    // If creating an admin, add admin permissions
    if (role === 'admin') {
      userObject.adminPermissions = adminPermissions || {
        canUpdateUserInfo: true,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canDemoteAdmins: false,
      };
    }

    // Create the user
    const user = await UserModel.create(userObject);

    // Remove password from response
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
