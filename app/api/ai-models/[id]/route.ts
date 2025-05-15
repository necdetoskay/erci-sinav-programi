import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Yardımcı fonksiyon: URL'den sorgu parametrelerini al
function getQueryParams(url: string) {
  const searchParams = new URL(url).searchParams;
  return Object.fromEntries(searchParams.entries());
}

// GET: Belirli bir AI Model'i getir
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

    // URL'den kullanıcı ID'sini al
    const queryParams = getQueryParams(req.url);
    const userId = queryParams.userId;

    console.log(`Fetching model ${id} for userId: ${userId || 'null'}`);

    // Kullanıcı ID'si belirtilmişse, o kullanıcının modelini getir
    // Aksi takdirde, global modeli getir (userId = null)
    const whereClause = userId
      ? { id, userId }
      : { id };

    console.log(`Model where clause:`, whereClause);

    const model = await prisma.model.findFirst({
      where: whereClause,
      include: {
        provider: true, // Model'in ait olduğu provider'ı da getir
      },
    });

    if (!model) {
      return NextResponse.json(
        { error: "AI Model not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error fetching AI model:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI model" },
      { status: 500 }
    );
  }
}

// PATCH: AI Model'i güncelle
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

    // Kullanıcı ID'si belirtilmişse, o kullanıcı için model güncelle
    // Aksi takdirde, global model güncelle (userId = null)
    const userId = urlUserId || data.userId || null;

    console.log(`Updating model ${id} for userId: ${userId || 'null'}`);

    // Kullanıcı ID'si belirtilmişse, o kullanıcının modelini kontrol et
    // Aksi takdirde, global modeli kontrol et (userId = null)
    const whereClause = userId
      ? { id, userId }
      : { id };

    console.log(`Model where clause for update:`, whereClause);

    // Model'in var olup olmadığını kontrol et
    const existingModel = await prisma.model.findFirst({
      where: whereClause,
    });

    if (!existingModel) {
      return NextResponse.json(
        { error: "AI Model not found" },
        { status: 404 }
      );
    }

    // Eğer providerId değiştiriliyorsa, yeni provider'ın var olup olmadığını kontrol et
    if (data.providerId && data.providerId !== existingModel.providerId) {
      // Provider'ın kullanıcıya ait olup olmadığını kontrol et
      const providerWhereClause = userId
        ? { id: data.providerId, userId }
        : { id: data.providerId };

      console.log(`Provider where clause for model update:`, providerWhereClause);

      const provider = await prisma.provider.findFirst({
        where: providerWhereClause,
      });

      if (!provider) {
        return NextResponse.json(
          { error: "Provider not found" },
          { status: 404 }
        );
      }
    }

    // Model'i güncelle
    const updatedModel = await prisma.model.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        details: data.details !== undefined ? data.details : undefined,
        codeName: data.codeName !== undefined ? data.codeName : undefined,
        apiCode: data.apiCode !== undefined ? data.apiCode : undefined, // API kodunu güncelle
        providerId: data.providerId !== undefined ? data.providerId : undefined,
        orderIndex: data.orderIndex !== undefined ? data.orderIndex : undefined,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : undefined,
        userId: userId, // Kullanıcı ID'sini güncelle
      },
    });

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error("Error updating AI model:", error);
    return NextResponse.json(
      { error: "Failed to update AI model" },
      { status: 500 }
    );
  }
}

// DELETE: AI Model'i sil
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

    console.log(`Deleting model ${id} for userId: ${userId || 'null'}`);

    // Kullanıcı ID'si belirtilmişse, o kullanıcının modelini kontrol et
    // Aksi takdirde, global modeli kontrol et (userId = null)
    const whereClause = userId
      ? { id, userId }
      : { id };

    console.log(`Model where clause for delete:`, whereClause);

    // Model'in var olup olmadığını kontrol et
    const existingModel = await prisma.model.findFirst({
      where: whereClause,
    });

    if (!existingModel) {
      return NextResponse.json(
        { error: "AI Model not found" },
        { status: 404 }
      );
    }

    // Model'i sil
    await prisma.model.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI model:", error);
    return NextResponse.json(
      { error: "Failed to delete AI model" },
      { status: 500 }
    );
  }
}
