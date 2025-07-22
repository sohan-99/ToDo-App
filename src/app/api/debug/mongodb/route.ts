import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
export async function GET() {
  try {
    const connection = await connectToDatabase();
    return NextResponse.json(
      {
        status: 'Connected to MongoDB',
        databaseName: connection.db?.databaseName || 'unknown',
        connected: connection.readyState === mongoose.ConnectionStates.connected,
        readyState: connection.readyState,
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        status: 'Error connecting to MongoDB',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
