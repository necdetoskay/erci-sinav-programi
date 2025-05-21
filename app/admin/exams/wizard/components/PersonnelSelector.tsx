"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

// Personel tipi
interface Personnel {
  id: string;
  name: string;
  email: string;
  selected?: boolean;
}

interface PersonnelSelectorProps {
  personnel: Personnel[];
  onSelectPerson: (personId: string) => void;
  isLoading: boolean;
}

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({
  personnel,
  onSelectPerson,
  isLoading,
}) => {
  // İsimden avatar harflerini oluştur
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Personel bulunamadı.</p>
        <p className="text-sm mt-2">
          Lütfen arama kriterlerini değiştirin veya yeni personel ekleyin.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md max-h-[400px] overflow-y-auto">
      <div className="grid grid-cols-12 font-medium p-3 border-b bg-muted/50">
        <div className="col-span-1">Seç</div>
        <div className="col-span-3">Ad Soyad</div>
        <div className="col-span-8">E-posta</div>
      </div>
      <div className="divide-y">
        {personnel.map((person) => (
          <div
            key={person.id}
            className="grid grid-cols-12 p-3 items-center hover:bg-muted/30 transition-colors"
          >
            <div className="col-span-1">
              <Checkbox
                checked={person.selected}
                onCheckedChange={() => onSelectPerson(person.id)}
              />
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={person.name} />
                <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{person.name}</span>
            </div>
            <div className="col-span-8 text-sm truncate">{person.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
