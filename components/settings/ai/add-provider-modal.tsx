"use client";

import { useState } from 'react';
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

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProvider: (providerData: { name: string; apiKey: string }) => Promise<void>;
}

export function AddProviderModal({ isOpen, onClose, onAddProvider }: AddProviderModalProps) {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddClick = async () => {
    if (!name.trim() || !apiKey.trim()) {
      toast.error("Sağlayıcı adı ve API anahtarı boş olamaz.");
      return;
    }

    setIsLoading(true);
    try {
      await onAddProvider({ name, apiKey });
      setName('');
      setApiKey('');
      // onClose is called by onAddProvider on success
    } catch (error: any) {
      console.error("Error adding provider:", error);
      toast.error(`Sağlayıcı eklenirken bir hata oluştu: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Yapay Zeka Sağlayıcısı Ekle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider-name" className="text-right">
              Sağlayıcı Adı
            </Label>
            <Input
              id="provider-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right">
              API Anahtarı
            </Label>
            <Input
              id="api-key"
              type="password" // Use password type for API key
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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
