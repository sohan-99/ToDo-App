import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { RolePermissions } from '@/lib/permissions';

// GET all todos (super-admin only)
export async function GET(req: NextRequest) {
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

    // Connect to database and fetch all todos with user information
    await connectToDatabase();

    // Get query parameters for pagination and filtering
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Create query
    let query = {};
    if (search) {
      query = { title: { $regex: search, $options: 'i' } };
    }

    // Fetch todos with pagination and populate user information
    const todos = await TodoModel.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count total for pagination
    const total = await TodoModel.countDocuments(query);

    const transformedTodos = todos.map(todo => ({
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
    }));

    return NextResponse.json(
      {
        todos: transformedTodos,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a todo (super-admin only)
export async function PUT(req: NextRequest) {
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

    const { id, title, completed } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }

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
