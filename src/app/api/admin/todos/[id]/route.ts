import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { RolePermissions } from '@/lib/permissions';

// GET, DELETE, UPDATE a specific todo by ID (super-admin only)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;

    // Check if user has permissions to manage all todos
    if (!RolePermissions.canManageAllTodos(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const id = params.id;

    await connectToDatabase();

    const todo = await TodoModel.findById(id).populate('userId', 'name email');

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: todo._id.toString(),
        title: todo.title,
        completed: todo.completed,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
        user: todo.userId
          ? {
              id: todo.userId._id,
              name: todo.userId.name,
              email: todo.userId.email,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;

    // Check if user has permissions to manage all todos
    if (!RolePermissions.canManageAllTodos(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const id = params.id;

    await connectToDatabase();

    const result = await TodoModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Todo deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;

    // Check if user has permissions to manage all todos
    if (!RolePermissions.canManageAllTodos(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const id = params.id;
    const { title, completed } = await req.json();

    await connectToDatabase();

    const todo = await TodoModel.findById(id);

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Update fields if provided
    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();

    return NextResponse.json(
      {
        id: todo._id.toString(),
        title: todo.title,
        completed: todo.completed,
        updatedAt: todo.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
