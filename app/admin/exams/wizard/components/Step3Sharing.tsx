"use client";

import React, { useState, useEffect } from "react";
import { useWizard } from "./WizardContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PersonnelSelector } from "./PersonnelSelector";
import { useToast } from "@/components/ui/use-toast";
import { Search, RefreshCw, Copy, UserPlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateExamCode } from "@/lib/utils";

// Personel tipi
interface Personnel {
  id: string;
  name: string;
  email: string;
  selected?: boolean;
}

export const Step3Sharing: React.FC = () => {
  const { toast } = useToast();
  const { data, updateSharing, addPersonnel, removePersonnel } = useWizard();
  const { sharing } = data;

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<Personnel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPersonnel, setNewPersonnel] = useState({ name: "", email: "" });
  const [isAddingPersonnel, setIsAddingPersonnel] = useState(false);
  const [accessCode, setAccessCode] = useState(sharing.accessCode || generateExamCode());

  // Personel listesini yükle
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/users?role=PERSONEL&limit=1000");
        if (!response.ok) {
          throw new Error("Personel listesi yüklenirken bir hata oluştu");
        }
        const data = await response.json();

        // Seçili personeli işaretle
        const mappedPersonnel = data.map((person: Personnel) => ({
          ...person,
          selected: sharing.personnel.some((p) => p.id === person.id),
        }));

        setPersonnel(mappedPersonnel);
        setFilteredPersonnel(mappedPersonnel);
      } catch (error) {
        console.error("Personel listesi yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Personel listesi yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonnel();
  }, [toast, sharing.personnel]);

  // Personel filtrele
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPersonnel(personnel);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = personnel.filter(
        (person) =>
          person.name.toLowerCase().includes(term) ||
          person.email.toLowerCase().includes(term)
      );
      setFilteredPersonnel(filtered);
    }
  }, [searchTerm, personnel]);

  // Tüm personeli seç/kaldır
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedPersonnel = personnel.map((person) => ({
      ...person,
      selected: newSelectAll,
    }));

    setPersonnel(updatedPersonnel);
    setFilteredPersonnel(
      filteredPersonnel.map((person) => ({
        ...person,
        selected: newSelectAll,
      }))
    );

    // Context'i güncelle
    if (newSelectAll) {
      // Tüm personeli ekle
      updateSharing({
        personnel: personnel.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
        })),
      });
    } else {
      // Tüm personeli kaldır
      updateSharing({ personnel: [] });
    }
  };

  // Tek personel seç/kaldır
  const handleSelectPerson = (personId: string) => {
    // Personel listesini güncelle
    const updatedPersonnel = personnel.map((person) =>
      person.id === personId
        ? { ...person, selected: !person.selected }
        : person
    );

    setPersonnel(updatedPersonnel);

    // Filtrelenmiş listeyi güncelle
    const updatedFilteredPersonnel = filteredPersonnel.map((person) =>
      person.id === personId
        ? { ...person, selected: !person.selected }
        : person
    );

    setFilteredPersonnel(updatedFilteredPersonnel);

    // Tüm filtrelenmiş personel seçili mi kontrol et
    setSelectAll(updatedFilteredPersonnel.every((person) => person.selected));

    // Context'i güncelle
    const selectedPerson = updatedPersonnel.find((p) => p.id === personId);
    if (selectedPerson?.selected) {
      // Personel ekle
      addPersonnel({
        id: selectedPerson.id,
        name: selectedPerson.name,
        email: selectedPerson.email,
      });
    } else {
      // Personel kaldır
      removePersonnel(personId);
    }
  };

  // Erişim kodu oluştur
  const generateNewAccessCode = () => {
    const newCode = generateExamCode();
    setAccessCode(newCode);
    updateSharing({ accessCode: newCode });
  };

  // Erişim kodunu kopyala
  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast({
      title: "Kopyalandı",
      description: "Erişim kodu panoya kopyalandı",
    });
  };

  // Erişim kodunu güncelle
  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessCode(e.target.value);
    updateSharing({ accessCode: e.target.value });
  };

  // Görünürlük ayarını güncelle
  const handleVisibilityChange = (checked: boolean) => {
    updateSharing({ isPublic: checked });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Erişim Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-code">Erişim Kodu</Label>
            <div className="flex">
              <Input
                id="access-code"
                value={accessCode}
                onChange={handleAccessCodeChange}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyAccessCode}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={generateNewAccessCode}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Bu kod ile personel sınava erişebilir.
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2 pt-4">
            <Label htmlFor="public" className="flex-1">
              Herkese Açık
              <p className="text-sm font-normal text-muted-foreground">
                Etkinleştirilirse, tüm personel sınava erişebilir.
              </p>
            </Label>
            <Switch
              id="public"
              checked={sharing.isPublic}
              onCheckedChange={handleVisibilityChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personel Seçimi</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Yeni Personel Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Personel Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    placeholder="Personel adı ve soyadı"
                    value={newPersonnel.name}
                    onChange={(e) => setNewPersonnel({ ...newPersonnel, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@sirket.com"
                    value={newPersonnel.email}
                    onChange={(e) => setNewPersonnel({ ...newPersonnel, email: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bu e-posta adresine hesap bilgileri ve otomatik oluşturulan şifre gönderilecektir.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      // Doğrulama
                      if (!newPersonnel.name.trim() || !newPersonnel.email.trim()) {
                        toast({
                          title: "Hata",
                          description: "Lütfen tüm alanları doldurun",
                          variant: "destructive",
                        });
                        return;
                      }

                      // E-posta formatı doğrulama
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(newPersonnel.email)) {
                        toast({
                          title: "Hata",
                          description: "Lütfen geçerli bir e-posta adresi girin",
                          variant: "destructive",
                        });
                        return;
                      }

                      try {
                        setIsAddingPersonnel(true);

                        // Yeni personel oluştur
                        const response = await fetch("/api/admin/users", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: newPersonnel.name,
                            email: newPersonnel.email,
                            role: "PERSONEL",
                            emailVerified: true, // Otomatik onaylı
                            generatePassword: true, // Otomatik şifre oluştur
                            sendEmail: true, // E-posta gönder
                          }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || "Personel eklenirken bir hata oluştu");
                        }

                        const data = await response.json();

                        // Yeni personeli listeye ekle
                        const newPerson: Personnel = {
                          id: data.id,
                          name: newPersonnel.name,
                          email: newPersonnel.email,
                          selected: true,
                        };

                        // Personel listesini güncelle
                        setPersonnel((prev) => [...prev, { ...newPerson }]);
                        setFilteredPersonnel((prev) => [...prev, { ...newPerson }]);

                        // Context'e ekle
                        addPersonnel({
                          id: data.id,
                          name: newPersonnel.name,
                          email: newPersonnel.email,
                        });

                        toast({
                          title: "Başarılı",
                          description: "Personel başarıyla eklendi ve hesap bilgileri e-posta ile gönderildi",
                        });

                        // Formu temizle ve kapat
                        setNewPersonnel({ name: "", email: "" });
                        setShowAddDialog(false);
                      } catch (error) {
                        console.error("Personel ekleme hatası:", error);
                        toast({
                          title: "Hata",
                          description: error instanceof Error ? error.message : "Personel eklenirken bir hata oluştu",
                          variant: "destructive",
                        });
                      } finally {
                        setIsAddingPersonnel(false);
                      }
                    }}
                    disabled={isAddingPersonnel}
                  >
                    {isAddingPersonnel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Personel Ekle ve Davet Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all">Tümünü Seç</Label>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim veya e-posta ile ara..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <PersonnelSelector
            personnel={filteredPersonnel}
            onSelectPerson={handleSelectPerson}
            isLoading={isLoading}
          />

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              {sharing.personnel.length} personel seçildi
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
