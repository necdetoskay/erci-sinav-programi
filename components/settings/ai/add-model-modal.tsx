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

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: number | null;
  onAddModel: (providerId: number, modelData: { name: string }) => Promise<void>;
}

export function AddModelModal({ isOpen, onClose, providerId, onAddModel }: AddModelModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens or providerId changes
  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen, providerId]);


  const handleAddClick = async () => {
    if (!name.trim()) {
      toast.error("Model adı boş olamaz.");
      return;
    }
    if (providerId === null) {
        toast.error("Sağlayıcı seçilmedi.");
        return;
    }

    setIsLoading(true);
    try {
      await onAddModel(providerId, { name });
      setName('');
      // onClose is called by onAddModel on success
    } catch (error: any) {
      console.error("Error adding model:", error);
      toast.error(`Model eklenirken bir hata oluştu: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Model Ekle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model-name" className="text-right">
              Model Adı
            </Label>
            <Input
              id="model-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddClick} disabled={isLoading}>
            {isLoading ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
