/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// GET /api/stats - Get statistics for the dashboard
export async function GET() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Connect to the database
    await connectToDatabase();

    // User's own task stats
    const userTodos = await TodoModel.find({ userId });
    const activeTasks = userTodos.filter(todo => !todo.completed).length;
    const completedTasks = userTodos.filter(todo => todo.completed).length;
    const pendingTasks = activeTasks;

    // Response object with user stats
    const response: {
      userStats: {
        total: number;
        active: number;
        completed: number;
        pending: number;
      };
      adminStats: {
        totalUsers: number;
        totalTasks: number;
        systemStatus: string;
      } | null;
    } = {
      userStats: {
        total: userTodos.length,
        active: activeTasks,
        completed: completedTasks,
        pending: pendingTasks,
      },
      adminStats: null,
    };

    // If admin or super-admin, add additional stats
    if (userRole === 'admin' || userRole === 'super-admin') {
      const totalUsers = await UserModel.countDocuments();
      const totalTasks = await TodoModel.countDocuments();

      // Admin stats
      response.adminStats = {
        totalUsers,
        totalTasks,
        systemStatus: 'Active',
      };
    }

    return NextResponse.json(response);
  } catch (_error) {
    // Error is caught but not used to avoid linting errors
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
