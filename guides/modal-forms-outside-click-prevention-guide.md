# Next.js Uygulamalarında Modal Formların Dışına Tıklayınca Kapanmasını Engelleme Rehberi

Bu rehber, Next.js uygulamalarınızda modal formların dışına tıklandığında kapanmasını engelleyerek, kullanıcıların yanlışlıkla veri kaybetmesini önlemenize yardımcı olacaktır.

## İçindekiler

1. [Giriş](#giriş)
2. [Neden Modal Formların Dışına Tıklayınca Kapanması Engellenmelidir?](#neden-modal-formların-dışına-tıklayınca-kapanması-engellenmelidir)
3. [Uygulama](#uygulama)
4. [Örnekler](#örnekler)
5. [Özelleştirme](#özelleştirme)
6. [Erişilebilirlik](#erişilebilirlik)
7. [Sonuç](#sonuç)

## Giriş

Modal formlar, kullanıcıların veri girmesi veya belirli işlemleri gerçekleştirmesi için sıkça kullanılan arayüz bileşenleridir. Ancak, kullanıcılar yanlışlıkla modal dışına tıkladığında formun kapanması ve girilen verilerin kaybolması, kötü bir kullanıcı deneyimine yol açabilir.

Bu rehber, modal formların sadece açık bir şekilde kapatma butonu veya iptal butonu ile kapatılabilmesini sağlayarak, kullanıcıların yanlışlıkla veri kaybetmesini önlemenize yardımcı olacaktır.

## Neden Modal Formların Dışına Tıklayınca Kapanması Engellenmelidir?

1. **Veri Kaybını Önleme**: Kullanıcılar, uzun bir form doldururken yanlışlıkla modal dışına tıklayabilir ve tüm girdilerini kaybedebilir.
2. **Kullanıcı Deneyimini İyileştirme**: Kullanıcılar, formun nasıl kapatılacağını açıkça bildiğinde daha iyi bir deneyim yaşarlar.
3. **Kullanıcı Kontrolünü Artırma**: Kullanıcılar, formu kapatma kararını bilinçli olarak vermelidir.

## Uygulama

### 1. Dialog veya Modal Bileşeni Oluşturma

Öncelikle, dışa tıklamayı engelleyen bir dialog veya modal bileşeni oluşturalım:

```tsx
// components/ui/modal.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Modal açıldığında body scrollunu engelle
      document.body.style.overflow = 'hidden';
    } else {
      // Modal kapandığında animasyon için kısa bir gecikme
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Body scrollunu geri aç
        document.body.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0"
      )}
      // Dışa tıklamayı engelle - onClick olayını burada kullanmıyoruz
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-lg w-full max-w-md transform transition-transform duration-300",
          isOpen ? "scale-100" : "scale-95",
          className
        )}
        // Dışa tıklamanın modal içine yayılmasını engelle
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### 2. Modal Form Bileşeni Oluşturma

Şimdi, bu modal bileşenini kullanarak bir form modalı oluşturalım:

```tsx
// components/ui/modal-form.tsx
"use client";

import React from 'react';
import { Modal } from './modal';
import { Button } from './button';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  className?: string;
}

export const ModalForm: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Kaydet",
  cancelText = "İptal",
  isSubmitting = false,
  className,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className={className}
      // Kapatma butonunu gizle, sadece form butonlarıyla kapatılabilsin
      showCloseButton={false}
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          {children}
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "İşleniyor..." : submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

## Örnekler

### 1. Basit Bir Form Modalı Kullanımı

```tsx
// app/example/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModalForm } from '@/components/ui/modal-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ExamplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Form verilerini gönder
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form verileri:', formData);
      
      // Başarılı olduğunda modalı kapat
      setIsModalOpen(false);
      setFormData({ name: '', email: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Modal Form Örneği</h1>
      
      <Button onClick={() => setIsModalOpen(true)}>
        Formu Aç
      </Button>
      
      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title="Kullanıcı Bilgileri"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </ModalForm>
    </div>
  );
}
```

### 2. Onay Modalı Kullanımı

```tsx
// components/ui/confirmation-modal.tsx
"use client";

import React from 'react';
import { Modal } from './modal';
import { Button } from './button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Evet",
  cancelText = "Hayır",
  isConfirming = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={false}
    >
      <div className="py-2">
        <p>{message}</p>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isConfirming}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? "İşleniyor..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
};
```

## Özelleştirme

### 1. Farklı Modal Boyutları

Modal bileşenini farklı boyutlarda kullanmak için `className` prop'unu kullanabilirsiniz:

```tsx
<ModalForm
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleSubmit}
  title="Geniş Form"
  className="max-w-2xl" // Daha geniş bir modal
>
  {/* Form içeriği */}
</ModalForm>
```

### 2. Farklı Modal Stilleri

Modal bileşenini farklı stillerle özelleştirmek için `className` prop'unu kullanabilirsiniz:

```tsx
<ModalForm
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleSubmit}
  title="Özel Stilli Form"
  className="bg-gray-100 border-2 border-blue-500"
>
  {/* Form içeriği */}
</ModalForm>
```

## Erişilebilirlik

Modal bileşenlerinizin erişilebilir olması önemlidir. Aşağıdaki iyileştirmeleri yapabilirsiniz:

1. **Klavye Desteği**: ESC tuşuna basıldığında modalın kapanmasını sağlayın (isteğe bağlı).
2. **Focus Yönetimi**: Modal açıldığında focus'u modal içine alın ve kapatıldığında önceki elemana geri döndürün.
3. **ARIA Özellikleri**: Modal bileşenine uygun ARIA özelliklerini ekleyin.

```tsx
// Modal bileşenine eklenecek özellikler
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  // ...diğer özellikler
>
  <h2 id="modal-title">{title}</h2>
  {/* ...diğer içerikler */}
</div>
```

## Sonuç

Bu rehber, Next.js uygulamalarınızda modal formların dışına tıklandığında kapanmasını engelleyerek, kullanıcıların yanlışlıkla veri kaybetmesini önlemenize yardımcı oldu. Bu yaklaşım, kullanıcı deneyimini önemli ölçüde iyileştirir ve kullanıcıların formları daha güvenli bir şekilde doldurmasını sağlar.

Modal formlarınızı bu rehberdeki prensiplere göre tasarlayarak, kullanıcılarınıza daha iyi bir deneyim sunabilirsiniz. Unutmayın, iyi bir kullanıcı deneyimi, kullanıcıların uygulamanızı daha fazla kullanmasını ve daha memnun kalmasını sağlar.
