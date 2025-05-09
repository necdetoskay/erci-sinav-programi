"use client";

import { useRef, useState } from "react";
import { QuestionPoolHeader } from "./components/question-pool-header";
import { GenerateQuestions } from "./components/generate-questions";
import { GenerateQuestions as GenerateQuestionsFromText } from "./components/generate-questions-from-text";
import { GenerateQuestionsFromFile } from "./components/generate-questions-from-file"; // Yeni dosya yükleme bileşeni
import { CreateQuestion } from "./components/create-question";
import { QuestionList, ExtendedPoolQuestion, QuestionListRef } from "./components/question-list";
import { QuestionPool } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Sekme bileşenleri
import { Edit3, Baseline, FileText, Wand2 } from "lucide-react"; // İkonlar


interface QuestionPoolClientPageProps { // Renamed interface
  initialQuestionPoolData: (QuestionPool & {
    questions: ExtendedPoolQuestion[];
  }) | null; // Allow initial data to be null
}

export default function QuestionPoolClientPage({ initialQuestionPoolData }: QuestionPoolClientPageProps) { // Renamed function
  // Create a ref for the QuestionList component
  const questionListRef = useRef<QuestionListRef>(null);
  const [activeTab, setActiveTab] = useState("from-text"); // Varsayılan sekme

  // Destructure data for easier access, handle null case
  const poolId = initialQuestionPoolData?.id; // This is number | undefined
  const questions = initialQuestionPoolData?.questions || [];

  return (
    <div className="container py-6 space-y-6">
      <QuestionPoolHeader initialData={initialQuestionPoolData} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Manuel Soru Ekle
          </TabsTrigger>
          <TabsTrigger value="from-text" className="flex items-center gap-2">
            <Baseline className="h-4 w-4" />
            Metinden Soru Üret
          </TabsTrigger>
          <TabsTrigger value="from-file" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dosyadan Soru Üret
          </TabsTrigger>
          <TabsTrigger value="ai-generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI İle Soru Üret
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="mt-4">
          <CreateQuestion
            id={poolId} // Pass number | undefined
            onQuestionCreated={() => {
              questionListRef.current?.refreshQuestions();
              // İsteğe bağlı: Soru eklendikten sonra başka bir sekmeye geçilebilir
              // setActiveTab("from-text"); 
            }}
          />
        </TabsContent>
        <TabsContent value="from-text" className="mt-4">
          <GenerateQuestionsFromText
            poolId={poolId} // Pass number | undefined
            poolTitle={initialQuestionPoolData?.title}
            onQuestionsGenerated={() => questionListRef.current?.refreshQuestions()}
          />
        </TabsContent>
        <TabsContent value="from-file" className="mt-4">
          <GenerateQuestionsFromFile
            poolId={poolId} // Pass number | undefined
            poolTitle={initialQuestionPoolData?.title}
            onQuestionsGenerated={() => questionListRef.current?.refreshQuestions()}
          />
        </TabsContent>
        <TabsContent value="ai-generate" className="mt-4">
          <GenerateQuestions
            poolId={poolId} // Pass number | undefined
            poolTitle={initialQuestionPoolData?.title}
            onQuestionsGenerated={() => questionListRef.current?.refreshQuestions()}
          />
        </TabsContent>
      </Tabs>

      {/* Attach the ref to the QuestionList component */}
      {/* Pass questions, QuestionList handles empty array */}
      <QuestionList
        ref={questionListRef}
        questions={questions} // Pass the questions from initial data (or empty array)
        id={poolId} // Pass number | undefined
      />
    </div>
  );
}
