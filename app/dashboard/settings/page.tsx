"use client";

import React, { useState, useEffect, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UISettings } from './components/UISettings';
import { AppSettings } from './components/AppSettings';
import { ProviderManagement } from './components/ProviderManagement';
import { ModelManagement } from './components/ModelManagement';
import { Provider, Model } from './components/types';

function SettingsContent() {
  // Aktif tab state'i
  const [activeTab, setActiveTab] = useState<string>("ui");

  // Yapay zeka provider ve model state'leri
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Veritabanından provider ve model verilerini yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Provider'ları getir
        const providersResponse = await fetch('/api/ai-providers');
        if (!providersResponse.ok) {
          throw new Error('Provider verilerini getirme hatası');
        }
        const providersData = await providersResponse.json();
        setProviders(providersData);

        // Modelleri getir
        const modelsResponse = await fetch('/api/ai-models');
        if (!modelsResponse.ok) {
          throw new Error('Model verilerini getirme hatası');
        }
        const modelsData = await modelsResponse.json();
        setModels(modelsData);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Ayarlar</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="ui">Kullanıcı Arayüzü</TabsTrigger>
          <TabsTrigger value="app">Uygulama</TabsTrigger>
          <TabsTrigger value="ai">Yapay Zeka</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-4">
          <UISettings />
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <AppSettings />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <ProviderManagement
            providers={providers}
            setProviders={setProviders}
            selectedProviderId={selectedProviderId}
            setSelectedProviderId={setSelectedProviderId}
          />

          <ModelManagement
            models={models}
            setModels={setModels}
            providers={providers}
            selectedProviderId={selectedProviderId}
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
