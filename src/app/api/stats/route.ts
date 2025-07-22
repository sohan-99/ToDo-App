import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import UserModel from '@/models/User';
import { auth } from '@/app/api/auth/[...nextauth]/route';
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const userRole = session.user.role;
    await connectToDatabase();
    const userTodos = await TodoModel.find({ userId });
    const activeTasks = userTodos.filter(todo => !todo.completed).length;
    const completedTasks = userTodos.filter(todo => todo.completed).length;
    const pendingTasks = activeTasks;
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
    if (userRole === 'admin' || userRole === 'super-admin') {
      const totalUsers = await UserModel.countDocuments();
      const totalTasks = await TodoModel.countDocuments();
      response.adminStats = {
        totalUsers,
        totalTasks,
        systemStatus: 'Active',
      };
    }
    return NextResponse.json(response);
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
