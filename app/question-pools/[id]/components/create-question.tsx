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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
  id: number;
}

export function CreateQuestion({ id }: CreateQuestionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      options: [
        { text: "", label: "A" },
        { text: "", label: "B" },
        { text: "", label: "C" },
        { text: "", label: "D" },
      ],
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
    try {
      const response = await fetch(`/api/question-pools/${id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Soru eklenirken bir hata oluştu");
      }

      toast.success("Soru başarıyla eklendi");
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Soru eklenirken bir hata oluştu");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Soru</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Yeni Soru Ekle</DialogTitle>
          <DialogDescription>
            Soru bilgilerini girin. Soru metni ve şıklarda zengin metin düzenleyici kullanabilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
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
                            <RichTextEditor
                              content={field.value}
                              onChange={field.onChange}
                              placeholder="Şık metnini yazın..."
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
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Çözüm açıklamasını yazın..."
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

            <div className="flex justify-end">
              <Button type="submit">Ekle</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 