import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { QuestionList } from "./components/question-list";
import { CreateQuestion } from "./components/create-question";
import { QuestionPoolHeader } from "./components/question-pool-header";
import { GenerateQuestions } from "./components/generate-questions";
import { UpdateQuestion } from "./components/update-question";

export const metadata = {
  title: "Soru Havuzu",
  description: "Soru havuzu detayları ve soruları",
};

interface QuestionPoolPageProps {
  params: {
    id: string;
  };
}

export default async function QuestionPoolPage({ params }: QuestionPoolPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const questionPool = await db.questionPool.findUnique({
    where: {
      id: parseInt(params.id),
      userId: session.user.id,
    },
    include: {
      questions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!questionPool) {
    redirect("/question-pools");
  }

  return (
    <div className="container py-6 space-y-6">
      <QuestionPoolHeader initialData={questionPool} />
      <div className="flex justify-end gap-2">
        <GenerateQuestions 
          poolId={questionPool.id}
          title={questionPool.title}
          subject={questionPool.subject}
          grade={questionPool.grade}
          difficulty={questionPool.difficulty}
          description={questionPool.description || undefined}
        />
        <CreateQuestion id={questionPool.id} />
      </div>
      <QuestionList questions={questionPool.questions} id={questionPool.id} />
    </div>
  );
} 