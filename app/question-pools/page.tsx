import { Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/session";
import { QuestionPoolList } from "./components/question-pool-list";
import { CreateQuestionPool } from "./components/create-question-pool";

export const metadata: Metadata = {
  title: "Soru Havuzları",
  description: "Soru havuzlarınızı yönetin",
};

async function QuestionPoolsContent() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const questionPools = await db.questionPool.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      questions: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Soru Havuzları</h1>
          <p className="text-muted-foreground">
            Soru havuzlarınızı oluşturun ve yönetin
          </p>
        </div>
        <CreateQuestionPool />
      </div>

      <QuestionPoolList questionPools={questionPools} />
    </div>
  );
}

export default function QuestionPoolsPage() {
  return (
    <Suspense fallback={<div>Loading question pools...</div>}>
      <QuestionPoolsContent />
    </Suspense>
  );
}
