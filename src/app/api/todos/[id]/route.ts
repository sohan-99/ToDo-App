import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

interface Params {
  params: {
    id: string;
  };
}

// GET a specific todo by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    // Connect to the database
    await connectToDatabase();

    // Get the todo
    const todo = await TodoModel.findOne({ _id: id, userId });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Transform for response
    const transformedTodo = {
      id: todo._id.toString(),
      title: todo.title,
      completed: todo.completed,
    };

    return NextResponse.json(transformedTodo, { status: 200 });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT to update a specific todo
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;
    const body = await req.json();

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find and update the todo
    const todo = await TodoModel.findOneAndUpdate(
      { _id: id, userId },
      { title: body.title, completed: body.completed },
      { new: true }
    );

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Transform for response
    const transformedTodo = {
      id: todo._id.toString(),
      title: todo.title,
      completed: todo.completed,
    };

    return NextResponse.json(transformedTodo, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a specific todo
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }

    // Connect to the database
    await connectToDatabase();

    // Delete the todo
    const todo = await TodoModel.findOneAndDelete({ _id: id, userId });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
