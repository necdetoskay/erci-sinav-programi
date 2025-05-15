import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt-auth';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Access token not found' },
        { status: 401 }
      );
    }

    const decodedUser = verifyAccessToken(accessToken);

    if (!decodedUser) {
      return NextResponse.json(
        { message: 'Invalid or expired access token' },
        { status: 401 }
      );
    }

    // Kullanıcı bilgilerini döndür
    return NextResponse.json({
      id: decodedUser.id,
      email: decodedUser.email,
      role: decodedUser.role,
    }, { status: 200 });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { message: 'Error verifying token' },
      { status: 500 }
    );
  }
}
