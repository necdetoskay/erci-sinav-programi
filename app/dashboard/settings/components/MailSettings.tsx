"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AppSettings } from '@/lib/settings';
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react';

interface MailSettingsProps {
  userId: string | null;
}

export const MailSettings = ({ userId }: MailSettingsProps) => {
  // Form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('25');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [tlsRejectUnauthorized, setTlsRejectUnauthorized] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on component mount or when userId changes
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Sadece kullanıcı ayarlarını getir (global ayarları dahil etme)
        const url = `/api/settings/user-only?userId=${userId}`;

        console.log(`Fetching Mail settings from: ${url} at ${new Date().toISOString()}`);

        const response = await fetch(url, {
          // Cache'i devre dışı bırak
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const userSettingsData = await response.json();
          console.log(`User-only mail settings for ${userId}:`, userSettingsData);

          // Kullanıcı ayarlarını yükle
          setSmtpHost(userSettingsData.SMTP_HOST || '');
          setSmtpPort(userSettingsData.SMTP_PORT || '25');
          setSmtpSecure(userSettingsData.SMTP_SECURE === 'true');
          setAuthEnabled(userSettingsData.SMTP_AUTH_ENABLED === 'true');
          setSmtpUser(userSettingsData.SMTP_USER || '');
          setSmtpPass(userSettingsData.SMTP_PASS || '');
          setEmailFrom(userSettingsData.EMAIL_FROM || '');
          setTlsRejectUnauthorized(userSettingsData.TLS_REJECT_UNAUTHORIZED !== 'false');
        } else {
          // Kullanıcı ayarları yoksa varsayılan değerleri kullan
          console.log(`No mail settings found for user ${userId}, using defaults`);
          setSmtpHost('');
          setSmtpPort('25');
          setSmtpSecure(false);
          setAuthEnabled(false);
          setSmtpUser('');
          setSmtpPass('');
          setEmailFrom('');
          setTlsRejectUnauthorized(true);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Ayarlar yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  const handleSaveSettings = async () => {
    if (!userId) {
      toast.error('Kullanıcı seçilmedi');
      return;
    }

    setIsSaving(true);

    try {
      const settingsToUpdate = {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_SECURE: smtpSecure.toString(),
        SMTP_AUTH_ENABLED: authEnabled.toString(),
        SMTP_USER: smtpUser,
        SMTP_PASS: smtpPass,
        EMAIL_FROM: emailFrom,
        TLS_REJECT_UNAUTHORIZED: tlsRejectUnauthorized.toString()
      };

      // Kullanıcı bazında ayarları güncelle
      const scope = 'user';
      const url = `/api/settings?scope=${scope}&userId=${userId}`;

      console.log(`Saving Mail settings to: ${url}`);
      console.log(`Mail settings to save:`, settingsToUpdate);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('E-posta ayarları başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!userId) {
      toast.error('Kullanıcı seçilmedi');
      return;
    }

    setIsSendingTest(true);

    try {
      // Use current form values, not saved settings
      const testSettings = {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_SECURE: smtpSecure,
        SMTP_AUTH_ENABLED: authEnabled,
        SMTP_USER: authEnabled ? smtpUser : '',
        SMTP_PASS: authEnabled ? smtpPass : '',
        EMAIL_FROM: emailFrom,
        RECIPIENT_EMAIL: recipientEmail || emailFrom, // Alıcı e-posta adresi belirtilmemişse gönderen adresi kullan
        TLS_REJECT_UNAUTHORIZED: tlsRejectUnauthorized,
        SAVE_SETTINGS: true, // Ayarları kaydet
        USER_ID: userId // Hangi kullanıcı için ayarları kaydedeceğimizi belirt
      };

      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send test email');
      }

      toast.success('Test e-postası başarıyla gönderildi');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(`Test e-postası gönderilemedi: ${error.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>E-posta Ayarları</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-posta Ayarları</CardTitle>
        <CardDescription>
          E-posta gönderimi için SMTP sunucu ayarlarını yapılandırın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sunucu Ayarları Bölümü */}
        <div>
          <h3 className="text-lg font-medium mb-4">Sunucu Ayarları</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Sunucu Adresi</Label>
              <Input
                id="smtp-host"
                placeholder="örn: smtp.example.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="25"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="smtp-secure"
              checked={smtpSecure}
              onCheckedChange={setSmtpSecure}
            />
            <Label htmlFor="smtp-secure">Güvenli Bağlantı (SSL/TLS)</Label>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="tls-reject-unauthorized"
              checked={tlsRejectUnauthorized}
              onCheckedChange={setTlsRejectUnauthorized}
            />
            <Label htmlFor="tls-reject-unauthorized">TLS Sertifika Doğrulaması</Label>
          </div>
        </div>

        <Separator />

        {/* Kimlik Doğrulama Bölümü */}
        <div>
          <h3 className="text-lg font-medium mb-4">Kimlik Doğrulama</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="auth-enabled"
              checked={authEnabled}
              onCheckedChange={setAuthEnabled}
            />
            <Label htmlFor="auth-enabled">Kimlik Doğrulama Kullan</Label>
          </div>

          {authEnabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-user">Kullanıcı Adı</Label>
                <Input
                  id="smtp-user"
                  placeholder="örn: user@example.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-pass">Şifre</Label>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showPassword ? "text" : "password"}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Gönderici ve Alıcı Ayarları */}
        <div>
          <h3 className="text-lg font-medium mb-4">E-posta Adresleri</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email-from">Gönderen E-posta Adresi</Label>
              <Input
                id="email-from"
                placeholder="örn: noreply@example.com"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Test E-postası Alıcısı</Label>
              <Input
                id="recipient-email"
                placeholder="örn: test@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Boş bırakılırsa gönderen adresine gönderilir</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-auto">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ayarları Kaydet
          </Button>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleSendTestEmail}
            disabled={isSendingTest || !smtpHost || !emailFrom}
            className="w-full"
          >
            {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test E-postası Gönder
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
