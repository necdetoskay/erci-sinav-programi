import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Çerezleri temizlemek için bir NextResponse oluştur
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Çerezleri sil (maxAge: -1 veya expires ile geçmiş bir tarih ayarla)
    response.cookies.set('access-token', '', {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: -1, // Çerezi hemen geçersiz kıl
    });

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: -1, // Çerezi hemen geçersiz kıl
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    let errorMessage = 'An unexpected error occurred during logout';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { message: 'Error logging out', error: errorMessage },
      { status: 500 }
    );
  }
}
