"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { QuestionPool, QuestionPoolStatus } from "@/types/prisma";

const formSchema = z.object({
  title: z.string().min(1, "Başlık gereklidir"),
  description: z.string().optional(),
  subject: z.string().min(1, "Ders gereklidir"),
  // grade: z.coerce.number().min(1).max(12), // Sınıf alanı kaldırıldı
  difficulty: z.enum(["easy", "medium", "hard"]),
  status: z.enum([QuestionPoolStatus.ACTIVE, QuestionPoolStatus.INACTIVE]),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateQuestionPoolProps {
  data: QuestionPool;
}

export function UpdateQuestionPool({ data }: UpdateQuestionPoolProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data.title,
      description: data.description || "",
      subject: data.subject,
      // Gelen verinin türünü şemaya uygun hale getir
      // grade: Number(data.grade) || 9, // Sınıf alanı kaldırıldı
      difficulty: ["easy", "medium", "hard"].includes(data.difficulty)
        ? (data.difficulty as "easy" | "medium" | "hard")
        : "medium", // difficulty'nin enum'a uyduğundan emin ol, değilse 'medium' ata
      status: Object.values(QuestionPoolStatus).includes(data.status as QuestionPoolStatus)
        ? (data.status as QuestionPoolStatus)
        : QuestionPoolStatus.ACTIVE // status'un enum'a uyduğundan emin ol, değilse 'ACTIVE' ata
    },
  });

  // Form açıldığında değerleri görmek için onOpenChange'i kullanabiliriz
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      console.log("Form default values:", {
        status: data.status,
        isInEnum: Object.values(QuestionPoolStatus).includes(data.status as QuestionPoolStatus),
        enumValues: Object.values(QuestionPoolStatus),
        formStatus: form.getValues().status
      });
    }
  };

  async function onSubmit(formData: FormData) {
    try {
      const response = await fetch(`/api/question-pools/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Soru havuzu güncellenirken bir hata oluştu");
      }

      toast.success("Soru havuzu başarıyla güncellendi");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Soru havuzu güncellenirken bir hata oluştu");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={(e) => {
          // Dışarı tıklamayı engelle
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Soru Havuzunu Düzenle</DialogTitle>
          <DialogDescription>
            Soru havuzu bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        {/* İç <form> etiketi kaldırıldı, onSubmit ve className Form bileşenine taşındı */}
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ders</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sınıf FormField kaldırıldı */}

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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={QuestionPoolStatus.ACTIVE}>Aktif</SelectItem>
                      <SelectItem value={QuestionPoolStatus.INACTIVE}>Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">Güncelle</Button>
            </div>
          {/* </form> */}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
