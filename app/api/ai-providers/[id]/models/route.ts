import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ai-providers/[id]/models
// Lists all models for a specific AI provider
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const providerId = parseInt(params.id, 10);

  if (isNaN(providerId)) {
    return NextResponse.json({ message: 'Invalid provider ID' }, { status: 400 });
  }

  try {
    const models = await prisma.aiModel.findMany({
      where: { providerId: providerId },
      orderBy: { name: 'asc' }, // Order models alphabetically
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error(`Error fetching models for provider ID ${providerId}:`, error);
    return NextResponse.json({ message: 'Error fetching models' }, { status: 500 });
  }
}

// POST /api/ai-providers/[id]/models
// Adds a new model to a specific AI provider
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const providerId = parseInt(params.id, 10);

  if (isNaN(providerId)) {
    return NextResponse.json({ message: 'Invalid provider ID' }, { status: 400 });
  }

  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Model name is required' }, { status: 400 });
    }

    // Check if provider exists
    const provider = await prisma.aiProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ message: 'AI provider not found' }, { status: 404 });
    }

    const newModel = await prisma.aiModel.create({
      data: {
        name,
        providerId: providerId,
      },
    });

    return NextResponse.json(newModel, { status: 201 });
  } catch (error: any) {
    console.error(`Error adding model for provider ID ${providerId}:`, error);
     if (error.code === 'P2002') { // Prisma unique constraint violation
       return NextResponse.json({ message: `Model with name "${error.meta.target}" already exists for this provider.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error adding model' }, { status: 500 });
  }
}
