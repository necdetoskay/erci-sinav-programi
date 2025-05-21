"use client";

import React, { useState } from "react";
import { useWizard } from "./WizardContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { WizardSummary } from "./WizardSummary";

export const Step4Scheduling: React.FC = () => {
  const { data, updateScheduling } = useWizard();
  const { scheduling } = data;

  const [date, setDate] = useState<Date | undefined>(
    scheduling.startDate ? new Date(scheduling.startDate) : undefined
  );
  const [time, setTime] = useState<string>(
    scheduling.startDate
      ? format(new Date(scheduling.startDate), "HH:mm")
      : "09:00"
  );

  // Tarih değiştiğinde
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    
    if (newDate) {
      // Tarih ve saati birleştir
      const [hours, minutes] = time.split(":").map(Number);
      const dateTime = new Date(newDate);
      dateTime.setHours(hours, minutes, 0, 0);
      
      updateScheduling({ startDate: dateTime });
    } else {
      updateScheduling({ startDate: null });
    }
  };

  // Saat değiştiğinde
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    
    if (date) {
      // Tarih ve saati birleştir
      const [hours, minutes] = e.target.value.split(":").map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes, 0, 0);
      
      updateScheduling({ startDate: dateTime });
    }
  };

  // Hemen başlat değiştiğinde
  const handleStartImmediatelyChange = (checked: boolean) => {
    updateScheduling({ startImmediately: checked });
    
    if (checked) {
      // Hemen başlatılacaksa tarih ve saati sıfırla
      setDate(undefined);
      updateScheduling({ startDate: null });
    }
  };

  // E-posta gönderimi değiştiğinde
  const handleSendEmailsChange = (checked: boolean) => {
    updateScheduling({ sendEmails: checked });
  };

  // E-posta konusu değiştiğinde
  const handleEmailSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateScheduling({ emailSubject: e.target.value });
  };

  // E-posta içeriği değiştiğinde
  const handleEmailBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateScheduling({ emailBody: e.target.value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zamanlama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="start-immediately" className="flex-1">
              Hemen Başlat
              <p className="text-sm font-normal text-muted-foreground">
                Etkinleştirilirse, sınav oluşturulduğunda hemen başlayacaktır.
              </p>
            </Label>
            <Switch
              id="start-immediately"
              checked={scheduling.startImmediately}
              onCheckedChange={handleStartImmediatelyChange}
            />
          </div>

          {!scheduling.startImmediately && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "PPP", { locale: tr })
                      ) : (
                        "Tarih seçin"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Başlangıç Saati</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="pl-8"
                    disabled={!date}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-posta Bildirimleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="send-emails" className="flex-1">
              E-posta Gönder
              <p className="text-sm font-normal text-muted-foreground">
                Etkinleştirilirse, seçilen personele e-posta bildirimi gönderilecektir.
              </p>
            </Label>
            <Switch
              id="send-emails"
              checked={scheduling.sendEmails}
              onCheckedChange={handleSendEmailsChange}
            />
          </div>

          {scheduling.sendEmails && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email-subject">E-posta Konusu</Label>
                <Input
                  id="email-subject"
                  value={scheduling.emailSubject}
                  onChange={handleEmailSubjectChange}
                  placeholder="Kent Konut Sınav Daveti"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">E-posta İçeriği</Label>
                <Textarea
                  id="email-body"
                  value={scheduling.emailBody}
                  onChange={handleEmailBodyChange}
                  placeholder="Sayın {AD_SOYAD},

{SINAV_ADI} sınavına katılmanız için davet edildiniz.

Sınav Kodu: {SINAV_KODU}

Sınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:
{SINAV_LINKI}

Saygılarımızla,
Kent Konut A.Ş."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Şablon değişkenleri: {"{AD_SOYAD}"}, {"{SINAV_ADI}"},{" "}
                  {"{SINAV_KODU}"}, {"{SINAV_LINKI}"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sınav Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <WizardSummary />
        </CardContent>
      </Card>
    </div>
  );
};
