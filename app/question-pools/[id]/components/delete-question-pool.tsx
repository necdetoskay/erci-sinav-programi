"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteQuestionPoolProps {
  id: number;
}

export function DeleteQuestionPool({ id }: DeleteQuestionPoolProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onDelete() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/question-pools/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Soru havuzu silinirken bir hata oluştu");
      }

      toast.success("Soru havuzu başarıyla silindi");
      setOpen(false);
      router.push("/question-pools");
    } catch (error) {
      toast.error("Soru havuzu silinirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Soru Havuzunu Sil</AlertDialogTitle>
          <AlertDialogDescription>
            Bu soru havuzunu silmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz ve havuzdaki tüm sorular silinecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Siliniyor..." : "Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 