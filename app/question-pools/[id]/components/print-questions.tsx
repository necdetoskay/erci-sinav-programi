"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
// Font eklemek için gerekli
import 'jspdf-autotable';
// PDF oluşturma için alternatif kütüphane
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

interface PrintQuestionsProps {
  id: number;
  title: string;
}

export function PrintQuestions({ id, title }: PrintQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Türkçe karakter desteği için özel font yükleme
  useEffect(() => {
    // Bu fonksiyon sadece client tarafında çalışacak
    if (typeof window !== 'undefined') {
      try {
        // pdfMake için varsayılan font tanımlaması
        (pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

        console.log("PDF için font desteği hazırlandı");
      } catch (error) {
        console.error("Font tanımlaması sırasında hata:", error);
      }
    }
  }, []);

  async function handlePrint() {
    try {
      setIsLoading(true);

      // Soruları API'den al
      console.log(`Sorular alınıyor: /api/question-pools/${id}/questions`);
      const response = await fetch(`/api/question-pools/${id}/questions`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API yanıt hatası:", response.status, errorText);
        throw new Error(`Sorular yüklenirken bir hata oluştu: ${response.status}`);
      }

      const questions = await response.json();

      // Soruları kontrol et
      console.log("Alınan sorular:", questions);

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        toast.error("Soru havuzunda soru bulunamadı");
        setIsLoading(false);
        return;
      }

      // QR Kodu oluştur
      let qrCodeDataUrl;
      try {
        qrCodeDataUrl = await QRCode.toDataURL(`${window.location.origin}/question-pools/${id}`);
      } catch (error) {
        console.error("QR kodu oluşturulurken hata:", error);
      }

      // pdfMake ile PDF oluştur
      console.log("pdfMake ile PDF oluşturuluyor...");

      // PDF içeriğini hazırla
      const docDefinition = {
        // Varsayılan stil tanımlaması - font belirtmeden varsayılan fontu kullan
        defaultStyle: {
          fontSize: 12
        },
        content: [
          // Başlık ve QR Kodu
          {
            columns: [
              {
                width: 50,
                image: qrCodeDataUrl,
                fit: [40, 40]
              },
              {
                width: '*',
                text: title,
                style: 'header',
                alignment: 'center'
              }
            ]
          },
          // Sınav Kodu
          {
            text: `Sınav Kodu: ${id}`,
            style: 'subheader',
            margin: [0, 10, 0, 20]
          },
          // Sorular
          ...questions.map((question: any, index: number) => {
            // HTML etiketlerini temizle
            const questionText = question.questionText ? question.questionText.replace(/<[^>]*>/g, '') : "";

            // Şıkları hazırla
            const options = question.options && Array.isArray(question.options)
              ? question.options.map((option: any, optionIndex: number) => {
                  const optionText = option.text ? option.text.replace(/<[^>]*>/g, '') : "";
                  return {
                    text: `${String.fromCharCode(65 + optionIndex)}) ${optionText}`,
                    margin: [15, 5, 0, 0]
                  };
                })
              : [{ text: "[Şıklar bulunamadı]", margin: [15, 5, 0, 0] }];

            // Soru ve şıkları birleştir
            return [
              {
                text: `${index + 1}. ${questionText}`,
                style: 'question',
                margin: [0, 10, 0, 5]
              },
              ...options,
              { text: '', margin: [0, 5, 0, 0] } // Sorular arası boşluk
            ];
          }).flat() // İç içe dizileri düzleştir
        ],
        // Stil tanımlamaları
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 10, 0, 10]
          },
          subheader: {
            fontSize: 12,
            margin: [0, 5, 0, 5]
          },
          question: {
            fontSize: 12,
            bold: true
          }
        }
      };

      // PDF oluştur ve indir
      try {
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);

        console.log("PDF oluşturuldu, indiriliyor...");
        pdfDocGenerator.download(`${safeTitle}_sinav.pdf`);

        toast.success("Sınav başarıyla PDF olarak hazırlandı");
      } catch (pdfError) {
        console.error("PDF oluşturma hatası:", pdfError);
        toast.error(`PDF oluşturulurken hata: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);

        // Alternatif olarak jsPDF kullan
        try {
          console.log("pdfMake başarısız oldu, jsPDF deneniyor...");
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          // Başlık
          doc.setFontSize(16);
          doc.text(title, 105, 20, { align: "center" });

          // Sınav kodu
          doc.setFontSize(10);
          doc.text(`Sinav Kodu: ${id}`, 10, 35);

          // Soruları ekle
          doc.setFontSize(12);
          let y = 45;

          // Her soru için
          questions.forEach((question: any, index: number) => {
            const questionText = question.questionText ? question.questionText.replace(/<[^>]*>/g, '') : "";
            doc.text(`${index + 1}. ${questionText}`, 10, y);
            y += 10;

            // Şıklar
            if (question.options && Array.isArray(question.options)) {
              question.options.forEach((option: any, optionIndex: number) => {
                const optionText = option.text ? option.text.replace(/<[^>]*>/g, '') : "";
                doc.text(`${String.fromCharCode(65 + optionIndex)}) ${optionText}`, 15, y);
                y += 7;
              });
            }

            y += 5; // Sorular arası boşluk
          });

          const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          doc.save(`${safeTitle}_sinav.pdf`);

          toast.success("Sınav başarıyla PDF olarak hazırlandı (jsPDF ile)");
        } catch (jspdfError) {
          console.error("jsPDF hatası:", jspdfError);
          toast.error(`PDF oluşturulurken hata: ${jspdfError instanceof Error ? jspdfError.message : String(jspdfError)}`);
        }
      }
    } catch (error) {
      console.error("PDF oluşturulurken bir hata oluştu:", error);
      toast.error(`PDF oluşturulurken bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePrint}
      disabled={isLoading}
      title="Sınavı Yazdır"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
}
