import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Tüm AI Provider'ları getir
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = await prisma.provider.findMany({
      include: {
        models: true, // Provider'a ait modelleri de getir
      },
    });

    // API anahtarlarını maskele
    const maskedProviders = providers.map((provider: any) => {
      // API anahtarını maskele (ilk ve son 4 karakter görünür, ortası gizli)
      const apiKey = provider.apiKey;
      let maskedKey = apiKey;

      if (apiKey && apiKey.length > 8) {
        const firstFour = apiKey.substring(0, 4);
        const lastFour = apiKey.substring(apiKey.length - 4);
        const middleMask = '•'.repeat(apiKey.length - 8);
        maskedKey = `${firstFour}${middleMask}${lastFour}`;
      } else if (apiKey) {
        maskedKey = '••••••••';
      }

      return {
        ...provider,
        apiKey: maskedKey
      };
    });

    return NextResponse.json(maskedProviders);
  } catch (error) {
    console.error("Error fetching AI providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI providers" },
      { status: 500 }
    );
  }
}

// POST: Yeni AI Provider ekle
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Gerekli alanları kontrol et
    if (!data.name || !data.apiKey) {
      return NextResponse.json(
        { error: "Name and API Key are required" },
        { status: 400 }
      );
    }

    // API anahtarını doğrudan kaydet (şifreleme yok)
    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        description: data.description || "",
        apiKey: data.apiKey,
      },
    });

    // API anahtarını maskele
    let maskedKey = data.apiKey;
    if (data.apiKey && data.apiKey.length > 8) {
      const firstFour = data.apiKey.substring(0, 4);
      const lastFour = data.apiKey.substring(data.apiKey.length - 4);
      const middleMask = '•'.repeat(data.apiKey.length - 8);
      maskedKey = `${firstFour}${middleMask}${lastFour}`;
    } else if (data.apiKey) {
      maskedKey = '••••••••';
    }

    // Yanıtta API anahtarını maskele
    return NextResponse.json({
      ...provider,
      apiKey: maskedKey
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating AI provider:", error);
    return NextResponse.json(
      { error: "Failed to create AI provider" },
      { status: 500 }
    );
  }
}
