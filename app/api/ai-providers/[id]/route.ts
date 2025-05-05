import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ai-providers/[id]
// Gets a specific AI provider by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const providerId = parseInt(params.id, 10);

  if (isNaN(providerId)) {
    return NextResponse.json({ message: 'Invalid provider ID' }, { status: 400 });
  }

  try {
    const provider = await prisma.aiProvider.findUnique({
      where: { id: providerId },
      include: {
        models: true, // Include associated models
      },
    });

    if (!provider) {
      return NextResponse.json({ message: 'AI provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error(`Error fetching AI provider with ID ${providerId}:`, error);
    return NextResponse.json({ message: 'Error fetching AI provider' }, { status: 500 });
  }
}

// PUT /api/ai-providers/[id]
// Updates a specific AI provider by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const providerId = parseInt(params.id, 10);

  if (isNaN(providerId)) {
    return NextResponse.json({ message: 'Invalid provider ID' }, { status: 400 });
  }

  try {
    const { name, apiKey } = await request.json();

    if (!name || !apiKey) {
      return NextResponse.json({ message: 'Provider name and API key are required' }, { status: 400 });
    }

    const updatedProvider = await prisma.aiProvider.update({
      where: { id: providerId },
      data: {
        name,
        apiKey,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error: any) {
    console.error(`Error updating AI provider with ID ${providerId}:`, error);
     if (error.code === 'P2002') { // Prisma unique constraint violation
       return NextResponse.json({ message: `Provider with name "${error.meta.target}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error updating AI provider' }, { status: 500 });
  }
}

// DELETE /api/ai-providers/[id]
// Deletes a specific AI provider by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const providerId = parseInt(params.id, 10);

  if (isNaN(providerId)) {
    return NextResponse.json({ message: 'Invalid provider ID' }, { status: 400 });
  }

  try {
    await prisma.aiProvider.delete({
      where: { id: providerId },
    });

    return NextResponse.json({ message: 'AI provider deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting AI provider with ID ${providerId}:`, error);
     if (error.code === 'P2025') { // Prisma record not found
       return NextResponse.json({ message: 'AI provider not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error deleting AI provider' }, { status: 500 });
  }
}
