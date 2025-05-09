import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, UserPayload } from '@/lib/jwt-auth';

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

    // Token geçerli, kullanıcı bilgilerini döndür
    // Hassas bilgileri (örn: şifre hash'i) burada döndürmediğimizden emin olalım.
    // UserPayload zaten sadece id, email, role içeriyor.
    const user: UserPayload = {
      id: decodedUser.id,
      email: decodedUser.email,
      role: decodedUser.role,
      // Gerekirse veritabanından ek kullanıcı bilgileri (name, image vb.) çekilebilir
      // Ancak genellikle token'daki bilgiler yeterlidir veya ayrı bir /api/profile endpoint'i kullanılır.
    };

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { message: 'Error fetching current user' },
      { status: 500 }
    );
  }
}
