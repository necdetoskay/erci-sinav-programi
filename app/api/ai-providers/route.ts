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

    // URL'den kullanıcı ID'sini al
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Kullanıcı ID'si belirtilmişse, o kullanıcının provider'larını getir
    // Aksi takdirde, global provider'ları getir (userId = null)
    const whereClause = userId
      ? { userId: userId }
      : { userId: null };

    console.log(`Fetching providers with where clause:`, whereClause);

    const providers = await prisma.provider.findMany({
      where: whereClause,
      include: {
        models: true, // Provider'a ait modelleri de getir
      },
    });

    // API anahtarlarını açık olarak göster
    return NextResponse.json(providers);
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

    // URL'den kullanıcı ID'sini al
    const { searchParams } = new URL(req.url);
    const urlUserId = searchParams.get('userId');

    // Kullanıcı ID'si belirtilmişse, o kullanıcı için provider oluştur
    // Aksi takdirde, global provider oluştur (userId = null)
    const userId = urlUserId || data.userId || null;

    console.log(`Creating provider for userId: ${userId}`);

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
        userId: userId,
      },
    });

    // API anahtarını açık olarak göster
    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Error creating AI provider:", error);
    return NextResponse.json(
      { error: "Failed to create AI provider" },
      { status: 500 }
    );
  }
}
