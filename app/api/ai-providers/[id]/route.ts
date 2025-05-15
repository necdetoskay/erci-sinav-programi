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
    const queryParams = getQueryParams(req.url);
    const { showRawKey, userId } = queryParams;

    console.log(`Fetching provider ${id} for userId: ${userId || 'null'}`);

    // Kullanıcı ID'si belirtilmişse, o kullanıcının provider'ını getir
    // Aksi takdirde, global provider'ı getir (userId = null)
    const whereClause = userId
      ? { id, userId }
      : { id };

    console.log(`Provider where clause:`, whereClause);

    const provider = await prisma.provider.findFirst({
      where: whereClause,
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

    // API anahtarını açık olarak göster
    return NextResponse.json(provider);
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

    // URL'den kullanıcı ID'sini al
    const queryParams = getQueryParams(req.url);
    const urlUserId = queryParams.userId;

    // Kullanıcı ID'si belirtilmişse, o kullanıcı için provider güncelle
    // Aksi takdirde, global provider güncelle (userId = null)
    const userId = urlUserId || data.userId || null;

    console.log(`Updating provider ${id} for userId: ${userId || 'null'}`);

    // Kullanıcı ID'si belirtilmişse, o kullanıcının provider'ını kontrol et
    // Aksi takdirde, global provider'ı kontrol et (userId = null)
    const whereClause = userId
      ? { id, userId }
      : { id };

    console.log(`Provider where clause for update:`, whereClause);

    // Provider'ın var olup olmadığını kontrol et
    const existingProvider = await prisma.provider.findFirst({
      where: whereClause,
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
        userId: userId, // Kullanıcı ID'sini güncelle
      },
    });

    // API anahtarını açık olarak göster
    return NextResponse.json(updatedProvider);
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

    // URL'den kullanıcı ID'sini al
    const queryParams = getQueryParams(req.url);
    const userId = queryParams.userId;

    console.log(`Deleting provider ${id} for userId: ${userId || 'null'}`);

    // Kullanıcı ID'si belirtilmişse, o kullanıcının provider'ını kontrol et
    // Aksi takdirde, global provider'ı kontrol et (userId = null)
    const whereClause = userId
      ? { id, userId }
      : { id };

    console.log(`Provider where clause for delete:`, whereClause);

    // Provider'ın var olup olmadığını kontrol et
    const existingProvider = await prisma.provider.findFirst({
      where: whereClause,
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
