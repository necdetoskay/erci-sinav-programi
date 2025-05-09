import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

    const model = await prisma.model.findUnique({
      where: { id },
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

    // Model'in var olup olmadığını kontrol et
    const existingModel = await prisma.model.findUnique({
      where: { id },
    });

    if (!existingModel) {
      return NextResponse.json(
        { error: "AI Model not found" },
        { status: 404 }
      );
    }

    // Eğer providerId değiştiriliyorsa, yeni provider'ın var olup olmadığını kontrol et
    if (data.providerId && data.providerId !== existingModel.providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: data.providerId },
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
        providerId: data.providerId !== undefined ? data.providerId : undefined,
        orderIndex: data.orderIndex !== undefined ? data.orderIndex : undefined,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : undefined,
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

    // Model'in var olup olmadığını kontrol et
    const existingModel = await prisma.model.findUnique({
      where: { id },
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
