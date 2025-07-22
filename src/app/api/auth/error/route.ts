import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get('error');
  return NextResponse.redirect(
    new URL(`/auth/error?error=${encodeURIComponent(error || '')}`, req.url)
  );
}
