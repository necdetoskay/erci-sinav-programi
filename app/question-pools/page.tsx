import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { QuestionPoolList } from "./components/question-pool-list";
import { CreateQuestionPool } from "./components/create-question-pool";

export const metadata: Metadata = {
  title: "Soru Havuzları",
  description: "Soru havuzlarınızı yönetin",
};

export default async function QuestionPoolsPage() {
  const session = await auth();
  
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