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

    // URL'den providerId parametresini al
    const url = new URL(req.url);
    const providerId = url.searchParams.get("providerId");

    // Filtreleme koşullarını oluştur
    const where = providerId ? { providerId } : {};

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

    // Gerekli alanları kontrol et
    if (!data.name || !data.providerId || !data.codeName) {
      return NextResponse.json(
        { error: "Name, Provider ID and Code Name are required" },
        { status: 400 }
      );
    }

    // Provider'ın var olup olmadığını kontrol et
    const provider = await prisma.provider.findUnique({
      where: { id: data.providerId },
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
        codeName: data.codeName,
        providerId: data.providerId,
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
