import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// GET handler to retrieve todos for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Connect to the database
    await connectToDatabase();

    // Get todos for the user
    const todos = await TodoModel.find({ userId }).sort({ createdAt: -1 });

    // Transform MongoDB document to match our ITodo interface
    const transformedTodos = todos.map(todo => ({
      id: todo._id.toString(),
      title: todo.title,
      completed: todo.completed,
    }));

    return NextResponse.json(transformedTodos, { status: 200 });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler to create a new todo
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Validate request
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Connect to the database
    await connectToDatabase();

    // Create new todo
    const todo = await TodoModel.create({
      title: body.title,
      completed: body.completed || false,
      userId,
    });

    // Transform for response
    const transformedTodo = {
      id: todo._id.toString(),
      title: todo.title,
      completed: todo.completed,
    };

    return NextResponse.json(transformedTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
