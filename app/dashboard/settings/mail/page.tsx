"use client";

import React, { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { MailSettingsForm } from './components/MailSettingsForm';
import { AppSettings } from '@/lib/settings';
import { toast } from 'sonner';

export default function MailSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Ayarlar yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">E-posta Ayarları</h1>
      </div>
      
      <MailSettingsForm 
        initialSettings={settings} 
        isLoading={isLoading} 
      />
    </div>
  );
}
