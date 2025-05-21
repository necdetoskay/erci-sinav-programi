import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

// GET: Fetch recent activities
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type");
    const entityType = searchParams.get("entityType");

    // Build where condition
    const where: any = {};

    // Filter by type if provided
    if (type) {
      where.type = type;
    }

    // Filter by entityType if provided
    if (entityType) {
      where.entityType = entityType;
    }

    // Apply role-based access control
    const isAdmin = session.user.role === 'ADMIN';
    const isSuperAdmin = session.user.role === 'SUPERADMIN';

    // Admin users can only see activities related to their own entities or created by them
    if (isAdmin) {
      // First, get all exams created by this admin
      const adminExams = await prisma.exam.findMany({
        where: { createdById: session.user.id },
        select: { id: true }
      });

      // Get all question pools created by this admin
      const adminQuestionPools = await prisma.questionPool.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      });

      const adminExamIds = adminExams.map(exam => exam.id.toString());
      const adminQuestionPoolIds = adminQuestionPools.map(pool => pool.id.toString());

      // Admin can see:
      // 1. Activities they created
      // 2. Activities related to their exams
      // 3. Activities related to their question pools
      where.OR = [
        { userId: session.user.id },
        {
          AND: [
            { entityType: 'EXAM' },
            { entityId: { in: adminExamIds } }
          ]
        },
        {
          AND: [
            { entityType: 'QUESTION_POOL' },
            { entityId: { in: adminQuestionPoolIds } }
          ]
        }
      ];
    }
    // SuperAdmin users can see all activities
    // No additional conditions needed for SuperAdmin

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST: Create a new activity
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { type, title, description, entityId, entityType, metadata } = body;

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        type,
        title,
        description,
        entityId,
        entityType,
        metadata,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
