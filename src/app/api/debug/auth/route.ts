import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { showToast } from '@/lib/toast';
export async function GET() {
  try {
    const session = await auth();
    if (session) {
      return NextResponse.json(
        {
          status: 'Authenticated',
          user: {
            id: session.user?.id,
            name: session.user?.name,
            email: session.user?.email,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: 'Not authenticated',
          session: null,
        },
        { status: 401 }
      );
    }
  } catch (error) {
   showToast.info('Error checking authentication', error);
    return NextResponse.json(
      {
        status: 'Error checking authentication',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
