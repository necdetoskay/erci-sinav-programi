import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/ai-models/[id]
// Updates a specific AI model by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const modelId = parseInt(params.id, 10);

  if (isNaN(modelId)) {
    return NextResponse.json({ message: 'Invalid model ID' }, { status: 400 });
  }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Model name is required and must be a non-empty string' }, { status: 400 });
    }

    // Retrieve the model to check its providerId for the unique constraint check
    const existingModel = await prisma.aiModel.findUnique({
        where: { id: modelId },
        select: { providerId: true }
    });

    if (!existingModel) {
        return NextResponse.json({ message: 'Model not found' }, { status: 404 });
    }

    const updatedModel = await prisma.aiModel.update({
      where: { id: modelId },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updatedModel);
  } catch (error: any) {
    console.error(`Error updating AI model with ID ${modelId}:`, error);
     if (error.code === 'P2002') { // Prisma unique constraint violation (providerId, name)
       // Need providerId to give a more specific message, but it's complex to get here reliably
       // without another query or passing it in the request.
       return NextResponse.json({ message: `Model name already exists for this provider.` }, { status: 409 });
    }
     if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: 'Model not found' }, { status: 404 });
     }
    return NextResponse.json({ message: 'Error updating AI model' }, { status: 500 });
  }
}

// DELETE /api/ai-models/[id]
// Deletes a specific AI model by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const modelId = parseInt(params.id, 10);

  if (isNaN(modelId)) {
    return NextResponse.json({ message: 'Invalid model ID' }, { status: 400 });
  }

  try {
    await prisma.aiModel.delete({
      where: { id: modelId },
    });

    return NextResponse.json({ message: 'AI model deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting AI model with ID ${modelId}:`, error);
     if (error.code === 'P2025') { // Prisma record not found
       return NextResponse.json({ message: 'AI model not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error deleting AI model' }, { status: 500 });
  }
}
