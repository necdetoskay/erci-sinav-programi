"use client";

import React, { useState, useEffect, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UISettings } from './components/UISettings';
import { AppSettings } from './components/AppSettings';
import { MailSettings } from './components/MailSettings';
import { SystemSettings } from './components/SystemSettings';
import { ProviderManagement } from './components/ProviderManagement';
import { ModelManagement } from './components/ModelManagement';
import { Provider, Model } from './components/types';
import { UserSelector } from './components/UserSelector';
import { useAuth } from '@/hooks/useAuth';

function SettingsContent() {
  const { user } = useAuth();

  // Aktif tab state'i
  const [activeTab, setActiveTab] = useState<string>("ui");

  // Seçili kullanıcı state'i
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Yapay zeka provider ve model state'leri
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Oturum açan kullanıcıyı varsayılan olarak seç
  useEffect(() => {
    if (user?.id && !selectedUserId) {
      console.log(`Setting default user ID to current user: ${user.id}`);
      setSelectedUserId(user.id);
    }
  }, [user, selectedUserId]);

  // Seçili kullanıcı değiştiğinde log
  useEffect(() => {
    if (selectedUserId) {
      console.log(`Selected user changed to: ${selectedUserId}`);
    }
  }, [selectedUserId]);

  // Veritabanından provider ve model verilerini yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Eğer kullanıcı seçilmemişse, veri yükleme
        if (!selectedUserId) {
          return;
        }

        console.log(`Fetching AI providers and models for user: ${selectedUserId}`);

        // Provider'ları getir - kullanıcıya özel
        const providersUrl = `/api/ai-providers?userId=${selectedUserId}`;
        console.log(`Fetching providers from: ${providersUrl}`);

        const providersResponse = await fetch(providersUrl);
        if (!providersResponse.ok) {
          throw new Error('Provider verilerini getirme hatası');
        }
        const providersData = await providersResponse.json();
        setProviders(providersData);
        console.log(`Loaded ${providersData.length} providers for user ${selectedUserId}`);

        // Modelleri getir - kullanıcıya özel
        const modelsUrl = `/api/ai-models?userId=${selectedUserId}`;
        console.log(`Fetching models from: ${modelsUrl}`);

        const modelsResponse = await fetch(modelsUrl);
        if (!modelsResponse.ok) {
          throw new Error('Model verilerini getirme hatası');
        }
        const modelsData = await modelsResponse.json();
        setModels(modelsData);
        console.log(`Loaded ${modelsData.length} models for user ${selectedUserId}`);

        // Seçili provider ID'sini sıfırla
        setSelectedProviderId(null);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };

    fetchData();
  }, [selectedUserId]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Ayarlar</h1>

      {/* Kullanıcı seçme bileşeni */}
      <UserSelector
        selectedUserId={selectedUserId}
        onUserChange={(userId) => {
          console.log(`User selector changed to: ${userId}`);
          setSelectedUserId(userId);
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="ui">Kullanıcı Arayüzü</TabsTrigger>
          <TabsTrigger value="app">Uygulama</TabsTrigger>
          <TabsTrigger value="mail">E-posta</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
          <TabsTrigger value="ai">Yapay Zeka</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-4">
          <UISettings userId={selectedUserId} />
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <AppSettings userId={selectedUserId} />
        </TabsContent>

        <TabsContent value="mail" className="space-y-4">
          <MailSettings userId={selectedUserId} />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <ProviderManagement
            providers={providers}
            setProviders={setProviders}
            selectedProviderId={selectedProviderId}
            setSelectedProviderId={setSelectedProviderId}
            userId={selectedUserId}
          />

          <ModelManagement
            models={models}
            setModels={setModels}
            providers={providers}
            selectedProviderId={selectedProviderId}
            userId={selectedUserId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
