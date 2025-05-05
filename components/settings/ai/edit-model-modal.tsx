"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: { id: number; name: string } | null; // Pass the model object to edit
  onEditModel: (modelId: number, modelData: { name: string }) => Promise<void>;
}

export function EditModelModal({ isOpen, onClose, model, onEditModel }: EditModelModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when modal opens with model data
  useEffect(() => {
    if (isOpen && model) {
      setName(model.name);
    } else {
      setName(''); // Reset on close or if no model
    }
  }, [isOpen, model]);


  const handleEditClick = async () => {
    if (!name.trim()) {
      toast.error("Model adı boş olamaz.");
      return;
    }
    if (!model) {
        toast.error("Düzenlenecek model bulunamadı.");
        return;
    }

    setIsLoading(true);
    try {
      await onEditModel(model.id, { name: name.trim() });
      // onClose is called by onEditModel on success
    } catch (error: any) {
      console.error("Error editing model:", error);
      toast.error(`Model düzenlenirken bir hata oluştu: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modeli Düzenle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-model-name" className="text-right">
              Model Adı
            </Label>
            <Input
              id="edit-model-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleEditClick} disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
