import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth" // Assuming authOptions are defined here

export async function DELETE(
    request: Request,
    { params }: { params: { attemptId: string } }
) {
    console.log(`[API DELETE /api/exam/attempt/${params.attemptId}] Request received.`);
    // Optional: Add authentication/authorization check if needed
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // Add logic here to ensure the logged-in user is allowed to delete this attempt
    // e.g., check if attempt belongs to the user or if user is admin

    try {
        const attemptId = params.attemptId;
        if (!attemptId) {
            console.log("[API DELETE /api/exam/attempt] Missing attemptId.");
            return NextResponse.json({ message: 'Attempt ID is required.' }, { status: 400 });
        }

        console.log(`[API DELETE /api/exam/attempt/${attemptId}] Attempting to delete attempt.`);

        // Check if the attempt exists before trying to delete
        const attemptExists = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            select: { id: true } // Select only id for efficiency
        });

        if (!attemptExists) {
            console.log(`[API DELETE /api/exam/attempt/${attemptId}] Attempt not found.`);
            return NextResponse.json({ message: 'Exam attempt not found.' }, { status: 404 });
        }

        // Delete the exam attempt. Associated answers should cascade delete based on schema.
        await prisma.examAttempt.delete({
            where: { id: attemptId },
        });

        console.log(`[API DELETE /api/exam/attempt/${attemptId}] Successfully deleted attempt.`);
        return NextResponse.json({ message: 'Exam attempt deleted successfully.' }, { status: 200 });

    } catch (error) {
        console.error(`[API DELETE /api/exam/attempt/${params.attemptId}] Error deleting exam attempt:`, error);
        // Handle potential Prisma errors, e.g., record not found if check failed somehow
        if ((error as any)?.code === 'P2025') { // Prisma code for Record to delete does not exist.
             return NextResponse.json({ message: 'Exam attempt not found.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Failed to delete exam attempt.' }, { status: 500 });
    }
}
