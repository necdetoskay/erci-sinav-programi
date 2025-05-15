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

interface MailSettingsFormProps {
  initialSettings: AppSettings;
  isLoading: boolean;
}

export function MailSettingsForm({ initialSettings, isLoading }: MailSettingsFormProps) {
  // Form state
  const [smtpHost, setSmtpHost] = useState(initialSettings.SMTP_HOST || '');
  const [smtpPort, setSmtpPort] = useState(initialSettings.SMTP_PORT || '25');
  const [smtpSecure, setSmtpSecure] = useState(initialSettings.SMTP_SECURE === 'true');
  const [authEnabled, setAuthEnabled] = useState(initialSettings.SMTP_AUTH_ENABLED === 'true');
  const [smtpUser, setSmtpUser] = useState(initialSettings.SMTP_USER || '');
  const [smtpPass, setSmtpPass] = useState(initialSettings.SMTP_PASS || '');
  const [emailFrom, setEmailFrom] = useState(initialSettings.EMAIL_FROM || '');
  const [tlsRejectUnauthorized, setTlsRejectUnauthorized] = useState(
    initialSettings.TLS_REJECT_UNAUTHORIZED !== 'false'
  );
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Update form when initialSettings change
  useEffect(() => {
    if (!isLoading) {
      setSmtpHost(initialSettings.SMTP_HOST || '');
      setSmtpPort(initialSettings.SMTP_PORT || '25');
      setSmtpSecure(initialSettings.SMTP_SECURE === 'true');
      setAuthEnabled(initialSettings.SMTP_AUTH_ENABLED === 'true');
      setSmtpUser(initialSettings.SMTP_USER || '');
      setSmtpPass(initialSettings.SMTP_PASS || '');
      setEmailFrom(initialSettings.EMAIL_FROM || '');
      setTlsRejectUnauthorized(initialSettings.TLS_REJECT_UNAUTHORIZED !== 'false');
    }
  }, [initialSettings, isLoading]);

  const handleSaveSettings = async () => {
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
      
      const response = await fetch('/api/settings/mail', {
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
    setIsSendingTest(true);
    
    try {
      // Use current form values, not saved settings
      const testSettings = {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_SECURE: smtpSecure,
        SMTP_USER: authEnabled ? smtpUser : '',
        SMTP_PASS: authEnabled ? smtpPass : '',
        EMAIL_FROM: emailFrom,
        TLS_REJECT_UNAUTHORIZED: tlsRejectUnauthorized
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
        
        {/* Gönderici Ayarları */}
        <div>
          <h3 className="text-lg font-medium mb-4">Gönderici Ayarları</h3>
          <div className="space-y-2">
            <Label htmlFor="email-from">Gönderen E-posta Adresi</Label>
            <Input
              id="email-from"
              placeholder="örn: noreply@example.com"
              value={emailFrom}
              onChange={(e) => setEmailFrom(e.target.value)}
            />
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
}
