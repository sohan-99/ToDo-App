import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TodoModel from '@/models/Todo';
import { auth } from '@/app/api/auth/[...nextauth]/route';
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    await connectToDatabase();
    const todos = await TodoModel.find({ userId }).sort({ createdAt: -1 });
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
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    await connectToDatabase();
    const todo = await TodoModel.create({
      title: body.title,
      completed: body.completed || false,
      userId,
    });
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
