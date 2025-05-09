import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Yardımcı fonksiyon: URL'den sorgu parametrelerini al
function getQueryParams(url: string) {
  const searchParams = new URL(url).searchParams;
  return Object.fromEntries(searchParams.entries());
}

// GET: Belirli bir AI Provider'ı getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { showRawKey } = getQueryParams(req.url);

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        models: true, // Provider'a ait modelleri de getir
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider bulunamadı" },
        { status: 404 }
      );
    }

    // API anahtarını işle
    let apiKey = provider.apiKey;

    // showRawKey=true ise, anahtarı olduğu gibi göster
    if (showRawKey !== 'true') {
      // Normal durumda anahtarı maskele
      if (apiKey && apiKey.length > 8) {
        const firstFour = apiKey.substring(0, 4);
        const lastFour = apiKey.substring(apiKey.length - 4);
        const middleMask = '•'.repeat(apiKey.length - 8);
        apiKey = `${firstFour}${middleMask}${lastFour}`;
      } else if (apiKey) {
        apiKey = '••••••••';
      }
    }

    const responseProvider = {
      ...provider,
      apiKey
    };

    return NextResponse.json(responseProvider);
  } catch (error) {
    console.error("Error fetching AI provider:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI provider" },
      { status: 500 }
    );
  }
}

// PATCH: AI Provider'ı güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await req.json();

    // Provider'ın var olup olmadığını kontrol et
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: "AI Provider not found" },
        { status: 404 }
      );
    }

    // Provider'ı güncelle
    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        apiKey: data.apiKey !== undefined ? data.apiKey : undefined,
      },
    });

    // API anahtarını maskele
    let maskedKey = updatedProvider.apiKey;
    if (maskedKey && maskedKey.length > 8) {
      const firstFour = maskedKey.substring(0, 4);
      const lastFour = maskedKey.substring(maskedKey.length - 4);
      const middleMask = '•'.repeat(maskedKey.length - 8);
      maskedKey = `${firstFour}${middleMask}${lastFour}`;
    } else if (maskedKey) {
      maskedKey = '••••••••';
    }

    // Yanıtta API anahtarını maskele
    return NextResponse.json({
      ...updatedProvider,
      apiKey: maskedKey
    });
  } catch (error) {
    console.error("Error updating AI provider:", error);
    return NextResponse.json(
      { error: "Failed to update AI provider" },
      { status: 500 }
    );
  }
}

// DELETE: AI Provider'ı sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Provider'ın var olup olmadığını kontrol et
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: "AI Provider not found" },
        { status: 404 }
      );
    }

    // Provider'ı sil (ilişkili modeller de cascade ile silinecek)
    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI provider:", error);
    return NextResponse.json(
      { error: "Failed to delete AI provider" },
      { status: 500 }
    );
  }
}
