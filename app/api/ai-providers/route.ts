import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ai-providers
// Lists all AI providers
export async function GET() {
  try {
    const providers = await prisma.aiProvider.findMany({
      include: {
        models: true, // Include associated models
      },
    });
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    return NextResponse.json({ message: 'Error fetching AI providers' }, { status: 500 });
  }
}

// POST /api/ai-providers
// Creates a new AI provider
export async function POST(request: Request) {
  try {
    const { name, apiKey } = await request.json();

    if (!name || !apiKey) {
      return NextResponse.json({ message: 'Provider name and API key are required' }, { status: 400 });
    }

    const newProvider = await prisma.aiProvider.create({
      data: {
        name,
        apiKey,
      },
    });

    return NextResponse.json(newProvider, { status: 201 });
  } catch (error: any) {
    console.error('Error creating AI provider:', error);
    if (error.code === 'P2002') { // Prisma unique constraint violation
       return NextResponse.json({ message: `Provider with name "${error.meta.target}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating AI provider' }, { status: 500 });
  }
}
