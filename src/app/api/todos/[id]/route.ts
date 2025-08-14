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
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }
    await connectToDatabase();
    const todo = await TodoModel.findOne({ _id: id, userId });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    const transformedTodo = {
      id: todo._id.toString(),
      title: todo.title,
      completed: todo.completed,
    };
    return NextResponse.json(transformedTodo, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = params;
    const body = await req.json();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }
    await connectToDatabase();
    const todo = await TodoModel.findOneAndUpdate(
      { _id: id, userId },
      { title: body.title, completed: body.completed },
      { new: true }
    );
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    const transformedTodo = {
      id: todo._id.toString(),
      title: todo.title,
      completed: todo.completed,
    };
    return NextResponse.json(transformedTodo, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid todo ID' }, { status: 400 });
    }
    await connectToDatabase();
    const todo = await TodoModel.findOneAndDelete({ _id: id, userId });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
