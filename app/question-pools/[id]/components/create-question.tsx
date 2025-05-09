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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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

interface CreateQuestionProps {
  id: number | undefined;
  onQuestionCreated: () => void;
}

export function CreateQuestion({ id, onQuestionCreated }: CreateQuestionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: "",
      options: [
        { text: "", label: "A" },
        { text: "", label: "B" },
        { text: "", label: "C" },
        { text: "", label: "D" },
      ],
      correctAnswer: "A",
      difficulty: "medium",
      explanation: "",
      tags: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  async function onSubmit(data: FormData) {
    if (!id) {
      toast.error("Soru havuzu ID'si gereklidir");
      return;
    }

    try {
      console.log("Gönderilen veri:", data); // Debug log

      const response = await fetch(`/api/question-pools/${id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          questionPoolId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Hatası:", errorData); // Debug log
        throw new Error(errorData.message || "Soru eklenirken bir hata oluştu");
      }

      toast.success("Soru başarıyla eklendi");
      setOpen(false);
      form.reset();
      onQuestionCreated();
    } catch (error) {
      console.error("Form hatası:", error); // Debug log
      toast.error(error instanceof Error ? error.message : "Soru eklenirken bir hata oluştu");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Soru</Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border"
        onPointerDownOutside={(e) => {
          // Dışarı tıklamayı engelle
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Yeni Soru Ekle</DialogTitle>
          <DialogDescription>
            Soru bilgilerini girin. Soru metni ve şıklarda zengin metin düzenleyici kullanabilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soru Metni</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Soru metnini yazın..."
                      className="min-h-[100px] resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Şıklar</div>
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

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4">
                  <div className="w-12 pt-8 text-center font-medium">
                    {field.label}
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`options.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Şık metnini yazın..."
                              className="resize-y"
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

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doğru Cevap</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'A'}>
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
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Çözüm açıklamasını yazın..."
                      className="min-h-[100px] resize-y"
                    />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'medium'}>
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

            <div className="flex justify-end">
              <Button type="submit" disabled={!id}>
                Ekle
              </Button>
            </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
