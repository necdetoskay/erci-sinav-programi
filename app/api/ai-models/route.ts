import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Tüm AI Modelleri getir (opsiyonel olarak providerId ile filtreleme)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // URL'den parametreleri al
    const url = new URL(req.url);
    const providerId = url.searchParams.get("providerId");
    const userId = url.searchParams.get("userId");

    console.log(`Fetching models for providerId: ${providerId || 'all'}, userId: ${userId || 'null'}, session user: ${session?.user?.id || 'unknown'}`);

    // Filtreleme koşullarını oluştur
    let where: any = {};

    if (providerId) {
      where.providerId = providerId;
    }

    // Kullanıcı ID'si belirtilmişse, o kullanıcının modellerini getir
    // Aksi takdirde, global modelleri getir (userId = null)
    // VEYA kullanıcıya özel modeller yoksa, global modelleri de getir
    if (userId) {
      where.userId = userId;
    } else {
      // Değişiklik: userId = null VEYA userId = session.user.id olan modelleri getir
      where.OR = [
        { userId: null },
        { userId: session.user.id }
      ];
    }

    console.log(`Model where clause:`, where);

    const models = await prisma.model.findMany({
      where,
      include: {
        provider: true, // Model'in ait olduğu provider'ı da getir
      },
      orderBy: {
        orderIndex: 'asc' // Sıra numarasına göre sırala
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching AI models:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI models" },
      { status: 500 }
    );
  }
}

// POST: Yeni AI Model ekle
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Sadece oturum açmış kullanıcılar erişebilir
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // URL'den kullanıcı ID'sini al
    const url = new URL(req.url);
    const urlUserId = url.searchParams.get("userId");

    // Kullanıcı ID'si belirtilmişse, o kullanıcı için model oluştur
    // Aksi takdirde, global model oluştur (userId = null)
    const userId = urlUserId || data.userId || null;

    console.log(`Creating model for userId: ${userId || 'null'}`);

    // Gerekli alanları kontrol et
    if (!data.name || !data.providerId || !data.apiCode) {
      return NextResponse.json(
        { error: "Name, Provider ID and API Code are required" },
        { status: 400 }
      );
    }

    // Provider'ın var olup olmadığını kontrol et
    const providerWhereClause = userId
      ? { id: data.providerId, userId }
      : { id: data.providerId };

    console.log(`Provider where clause for model creation:`, providerWhereClause);

    const provider = await prisma.provider.findFirst({
      where: providerWhereClause,
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Aynı provider'a ait en yüksek orderIndex değerini bul
    const highestOrderIndex = await prisma.model.findFirst({
      where: {
        providerId: data.providerId,
        userId: userId,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    const model = await prisma.model.create({
      data: {
        name: data.name,
        details: data.details || "",
        apiCode: data.apiCode, // API kodunu kullan
        providerId: data.providerId,
        userId: userId,
        orderIndex: highestOrderIndex ? highestOrderIndex.orderIndex + 1 : 0, // Mevcut en yüksek değerin bir fazlası
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true, // Varsayılan olarak etkin
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Error creating AI model:", error);
    return NextResponse.json(
      { error: "Failed to create AI model" },
      { status: 500 }
    );
  }
}
