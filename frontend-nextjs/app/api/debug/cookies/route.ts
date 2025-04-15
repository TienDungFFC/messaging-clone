import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_NAME } from '@/utils/cookies';

export async function GET() {
  const cookieStore = cookies();
  const authToken = cookieStore.get(TOKEN_NAME);
  
  return NextResponse.json({
    hasToken: !!authToken,
    cookieName: TOKEN_NAME,
    tokenValue: authToken ? authToken.value.substring(0, 10) + '...' : null
  });
}
