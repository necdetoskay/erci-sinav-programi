"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useFieldArray, useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PoolQuestion } from "@prisma/client";

type QuestionOption = {
  text: string;
  label: string;
};

const formSchema = z.object({
  questionText: z.string().min(1, "Soru metni gereklidir"),
  options: z.array(
    z.object({
      text: z.string().min(1, "Şık metni gereklidir"),
      label: z.string(),
    })
  ).min(2, "En az 2 şık gereklidir"),
  correctAnswer: z.string().min(1, "Doğru cevap gereklidir"),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateQuestionProps {
  id: number;
  question: PoolQuestion & {
    options: QuestionOption[];
    tags?: string[];
  };
}

export function UpdateQuestion({ id, question }: UpdateQuestionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: question.questionText || "",
      options: Array.isArray(question.options) 
        ? question.options.map((option, index) => ({
            text: option.text || "",
            label: String.fromCharCode(65 + index),
          }))
        : [],
      correctAnswer: question.correctAnswer || "A",
      explanation: question.explanation || "",
      difficulty: (question.difficulty as "easy" | "medium" | "hard") || "medium",
      tags: Array.isArray(question.tags) ? question.tags : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "options",
    control: form.control,
  });

  async function onSubmit(data: FormData) {
    try {
      const response = await fetch(
        `/api/question-pools/${id}/questions/${question.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Soru güncellenirken bir hata oluştu");
      }

      toast.success("Soru başarıyla güncellendi");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Soru güncellenirken bir hata oluştu");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>Soruyu Düzenle</DialogTitle>
          <DialogDescription>
            Soru bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soru Metni</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Soru metnini yazın..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Şıklar</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        text: "",
                        label: String.fromCharCode(65 + fields.length),
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Şık Ekle
                  </Button>
                </div>
                <div className="grid gap-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="w-8 pt-8 text-center font-medium">
                        {field.label}
                      </div>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`options.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RichTextEditor
                                  content={field.value}
                                  onChange={field.onChange}
                                  placeholder="Şık metnini yazın..."
                                  className="min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-6"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doğru Cevap</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Doğru cevabı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fields.map((option) => (
                          <SelectItem key={option.id} value={option.label}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zorluk Seviyesi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zorluk seviyesi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Kolay</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="hard">Zor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Çözüm açıklamasını yazın..."
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Güncelle</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 