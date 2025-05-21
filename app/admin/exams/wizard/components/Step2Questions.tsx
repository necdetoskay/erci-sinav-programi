"use client";

import React, { useState } from "react";
import { useWizard } from "./WizardContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionList } from "./QuestionList";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuestionWizardTabs } from "./QuestionWizardTabs";

export const Step2Questions: React.FC = () => {
  const { data, addQuestion, removeQuestion, reorderQuestions, errors, setCurrentStep } = useWizard();
  const { questions } = data;

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saveToQuestionPool, setSaveToQuestionPool] = useState(true);

  // Bir sonraki adıma geçiş
  const handleContinueToNextStep = () => {
    setCurrentStep(2); // 0-indexed olduğu için 2, 3. adıma (Paylaşım) karşılık gelir
  };



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sınav Soruları</CardTitle>
          <QuestionWizardTabs
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            data={data}
            addQuestion={addQuestion}
            questionsCount={questions.length}
            onContinueToNextStep={handleContinueToNextStep}
            saveToQuestionPool={saveToQuestionPool}
            onSaveToQuestionPoolChange={setSaveToQuestionPool}
          />


        </CardHeader>
        <CardContent>
          {errors.questions && (
            <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
              {errors.questions[0]}
            </div>
          )}
          <QuestionList
            questions={questions}
            onRemove={removeQuestion}
            onReorder={reorderQuestions}
          />
          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Henüz soru eklenmedi.</p>
              <p className="text-sm mt-2">
                Soru eklemek için "Soru Ekle" butonuna tıklayın.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İpuçları</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Soru havuzundan soru seçerek hızlıca sınav oluşturabilirsiniz.
            </li>
            <li>
              Soruları sürükleyip bırakarak sıralamayı değiştirebilirsiniz.
            </li>
            <li>
              Sınavınızda en az bir soru olmalıdır.
            </li>
            <li>
              Soruların zorluk seviyelerini dengeli tutmaya çalışın.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
