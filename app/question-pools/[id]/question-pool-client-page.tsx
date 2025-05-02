"use client";

import { useRef } from "react";
import { QuestionPoolHeader } from "./components/question-pool-header";
import { GenerateQuestions } from "./components/generate-questions";
import { GenerateQuestionsFromText } from "./components/generate-questions-from-text"; // Yeni bileşeni import et
import { CreateQuestion } from "./components/create-question";
import { QuestionList, ExtendedPoolQuestion, QuestionListRef } from "./components/question-list";
import { QuestionPool } from "@prisma/client"; // Import QuestionPool type


interface QuestionPoolClientPageProps { // Renamed interface
  initialQuestionPoolData: (QuestionPool & {
    questions: ExtendedPoolQuestion[];
  }) | null; // Allow initial data to be null
}

export default function QuestionPoolClientPage({ initialQuestionPoolData }: QuestionPoolClientPageProps) { // Renamed function
  // Create a ref for the QuestionList component
  const questionListRef = useRef<QuestionListRef>(null);

  // Destructure data for easier access, handle null case
  const id = initialQuestionPoolData?.id;
  const questions = initialQuestionPoolData?.questions || [];

  return (
    <div className="container py-6 space-y-6">
      {/* Pass initialData, child component should handle null */}
      <QuestionPoolHeader initialData={initialQuestionPoolData} />
      <div className="flex justify-end gap-2">
        {/* Pass id and title, child component should handle null */}
        <GenerateQuestions
          poolId={id}
          poolTitle={initialQuestionPoolData?.title}
          onQuestionsGenerated={() => questionListRef.current?.refreshQuestions()}
        />
        {/* Yeni bileşeni ekle */}
        <GenerateQuestionsFromText
           poolId={id?.toString()} // id'yi string'e çevir
           poolTitle={initialQuestionPoolData?.title}
           onQuestionsGenerated={() => questionListRef.current?.refreshQuestions()}
         />
        {/* Pass the refresh function to CreateQuestion */}
        {/* Pass id, child component should handle null */}
        <CreateQuestion
          id={id}
          onQuestionCreated={() => questionListRef.current?.refreshQuestions()}
        />
      </div>
      {/* Attach the ref to the QuestionList component */}
      {/* Pass questions, QuestionList handles empty array */}
      <QuestionList
        ref={questionListRef}
        questions={questions} // Pass the questions from initial data (or empty array)
        id={id} // Pass id, QuestionList should handle null
      />
    </div>
  );
}
