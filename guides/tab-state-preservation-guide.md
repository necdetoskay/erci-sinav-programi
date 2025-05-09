# Next.js Uygulamalarında Sekme Durumunun Korunması Rehberi

Bu rehber, Next.js uygulamalarınızda form gönderimlerinden veya sayfa yenilemelerinden sonra sekme durumunun korunmasını sağlayarak, kullanıcı deneyimini iyileştirmenize yardımcı olacaktır.

## İçindekiler

1. [Giriş](#giriş)
2. [Neden Sekme Durumunun Korunması Önemlidir?](#neden-sekme-durumunun-korunması-önemlidir)
3. [Uygulama](#uygulama)
4. [Örnekler](#örnekler)
5. [Özelleştirme](#özelleştirme)
6. [Sorun Giderme](#sorun-giderme)
7. [Sonuç](#sonuç)

## Giriş

Çok sekmeli arayüzler, karmaşık verileri organize etmek ve kullanıcıların farklı içerik bölümleri arasında gezinmesini sağlamak için yaygın olarak kullanılır. Ancak, form gönderimlerinden veya sayfa yenilemelerinden sonra sekme durumunun sıfırlanması ve kullanıcının her zaman ilk sekmeye geri dönmesi, kötü bir kullanıcı deneyimine yol açabilir.

Bu rehber, sekme durumunun korunmasını sağlayarak, kullanıcıların kaldıkları yerden devam etmelerine olanak tanımanıza yardımcı olacaktır.

## Neden Sekme Durumunun Korunması Önemlidir?

1. **Kullanıcı Deneyimini İyileştirme**: Kullanıcılar, sayfa yenilemelerinden sonra kaldıkları yerden devam edebilirler.
2. **Verimliliği Artırma**: Kullanıcılar, her seferinde doğru sekmeyi tekrar bulmak zorunda kalmazlar.
3. **Kullanıcı Memnuniyetini Artırma**: Kullanıcılar, uygulamanın durumlarını hatırladığını gördüklerinde daha memnun olurlar.

## Uygulama

### 1. URL Tabanlı Sekme Durumu

URL parametrelerini kullanarak sekme durumunu korumak en yaygın ve etkili yöntemdir. Bu yaklaşım, sayfa yenilemelerinde ve form gönderimlerinde sekme durumunun korunmasını sağlar.

#### Tabs Bileşeni Oluşturma

```tsx
// components/ui/tabs.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  paramName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  className,
  tabClassName,
  activeTabClassName,
  contentClassName,
  paramName = 'tab',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL'den sekme durumunu al veya varsayılan sekmeyi kullan
  const tabParam = searchParams.get(paramName);
  const initialTab = tabParam || defaultTab || tabs[0]?.id;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // URL değiştiğinde sekme durumunu güncelle
  useEffect(() => {
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, tabs]);
  
  // Sekme değiştiğinde URL'yi güncelle
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Mevcut URL parametrelerini koru ve sadece sekme parametresini güncelle
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, tabId);
    
    // URL'yi güncelle (sayfa yenilenmeden)
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              tab.id === activeTab
                ? cn("border-b-2 border-primary text-primary", activeTabClassName)
                : cn("text-muted-foreground hover:text-foreground", tabClassName)
            )}
            aria-selected={tab.id === activeTab}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn("py-4", contentClassName)}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};
```

### 2. LocalStorage Tabanlı Sekme Durumu

URL parametreleri kullanmak istemiyorsanız, localStorage kullanarak sekme durumunu koruyabilirsiniz.

```tsx
// components/ui/local-storage-tabs.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface LocalStorageTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  storageKey: string;
}

export const LocalStorageTabs: React.FC<LocalStorageTabsProps> = ({
  tabs,
  defaultTab,
  className,
  tabClassName,
  activeTabClassName,
  contentClassName,
  storageKey,
}) => {
  // LocalStorage'dan sekme durumunu al veya varsayılan sekmeyi kullan
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(storageKey);
      if (savedTab && tabs.some(tab => tab.id === savedTab)) {
        return savedTab;
      }
    }
    return defaultTab || tabs[0]?.id;
  };
  
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Component mount olduğunda localStorage'dan sekme durumunu al
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, []);
  
  // Sekme değiştiğinde localStorage'a kaydet
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem(storageKey, tabId);
  };
  
  if (!activeTab) return null; // İlk render'da boş göster
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              tab.id === activeTab
                ? cn("border-b-2 border-primary text-primary", activeTabClassName)
                : cn("text-muted-foreground hover:text-foreground", tabClassName)
            )}
            aria-selected={tab.id === activeTab}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn("py-4", contentClassName)}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};
```

## Örnekler

### 1. URL Tabanlı Sekme Durumu Örneği

```tsx
// app/dashboard/page.tsx
"use client";

import { Tabs } from '@/components/ui/tabs';

export default function DashboardPage() {
  const tabs = [
    {
      id: 'overview',
      label: 'Genel Bakış',
      content: <div>Genel bakış içeriği burada...</div>,
    },
    {
      id: 'analytics',
      label: 'Analitik',
      content: <div>Analitik içeriği burada...</div>,
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      content: <div>Ayarlar içeriği burada...</div>,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      <Tabs
        tabs={tabs}
        defaultTab="overview"
        paramName="view"
      />
    </div>
  );
}
```

### 2. Form İçeren Sekme Örneği

```tsx
// app/profile/page.tsx
"use client";

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const [personalInfo, setPersonalInfo] = useState({
    name: 'John Doe',
    email: 'john@example.com',
  });
  
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form verilerini gönder
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Kişisel bilgiler güncellendi!');
  };
  
  const handleSecurityInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form verilerini gönder
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Güvenlik bilgileri güncellendi!');
    setSecurityInfo({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };
  
  const tabs = [
    {
      id: 'personal',
      label: 'Kişisel Bilgiler',
      content: (
        <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              value={personalInfo.name}
              onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              required
            />
          </div>
          
          <Button type="submit">Kaydet</Button>
        </form>
      ),
    },
    {
      id: 'security',
      label: 'Güvenlik',
      content: (
        <form onSubmit={handleSecurityInfoSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
            <Input
              id="currentPassword"
              type="password"
              value={securityInfo.currentPassword}
              onChange={(e) => setSecurityInfo({ ...securityInfo, currentPassword: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <Input
              id="newPassword"
              type="password"
              value={securityInfo.newPassword}
              onChange={(e) => setSecurityInfo({ ...securityInfo, newPassword: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={securityInfo.confirmPassword}
              onChange={(e) => setSecurityInfo({ ...securityInfo, confirmPassword: e.target.value })}
              required
            />
          </div>
          
          <Button type="submit">Şifreyi Güncelle</Button>
        </form>
      ),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>
      
      <Tabs
        tabs={tabs}
        defaultTab="personal"
        paramName="section"
      />
    </div>
  );
}
```

## Özelleştirme

### 1. Farklı Sekme Stilleri

Sekme bileşenini farklı stillerle özelleştirmek için `className` prop'larını kullanabilirsiniz:

```tsx
<Tabs
  tabs={tabs}
  defaultTab="overview"
  className="bg-gray-100 p-4 rounded-lg"
  tabClassName="px-6 py-3 rounded-t-lg"
  activeTabClassName="bg-white border-b-0 border-t-2 border-l-2 border-r-2"
  contentClassName="bg-white p-6 rounded-b-lg shadow-md"
/>
```

### 2. Dikey Sekmeler

Dikey sekme düzeni için bileşeni özelleştirebilirsiniz:

```tsx
// components/ui/vertical-tabs.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface VerticalTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  paramName?: string;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  tabs,
  defaultTab,
  className,
  tabClassName,
  activeTabClassName,
  contentClassName,
  paramName = 'tab',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tabParam = searchParams.get(paramName);
  const initialTab = tabParam || defaultTab || tabs[0]?.id;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, tabs]);
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, tabId);
    
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  return (
    <div className={cn("flex", className)}>
      <div className="w-1/4 border-r">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "w-full text-left px-4 py-3 font-medium transition-colors",
              tab.id === activeTab
                ? cn("bg-primary/10 text-primary border-l-4 border-primary", activeTabClassName)
                : cn("text-muted-foreground hover:bg-gray-100", tabClassName)
            )}
            aria-selected={tab.id === activeTab}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn("w-3/4 p-6", contentClassName)}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};
```

## Sorun Giderme

### 1. Sekme Durumu Korunmuyor

Eğer sekme durumu korunmuyorsa, şunları kontrol edin:

- URL parametrelerinin doğru şekilde ayarlandığından emin olun.
- Form gönderimlerinde `action` özelliğinin URL parametrelerini koruduğundan emin olun.
- Client-side routing kullanıyorsanız, `router.push()` çağrılarında mevcut URL parametrelerini koruduğunuzdan emin olun.

### 2. Sayfa Yenilemelerinde Sekme Sıfırlanıyor

Eğer sayfa yenilemelerinde sekme sıfırlanıyorsa, şunları kontrol edin:

- `useEffect` hook'unun doğru şekilde kullanıldığından emin olun.
- URL parametrelerinin doğru şekilde okunduğundan emin olun.
- LocalStorage kullanıyorsanız, değerlerin doğru şekilde kaydedildiğinden ve okunduğundan emin olun.

## Sonuç

Bu rehber, Next.js uygulamalarınızda form gönderimlerinden veya sayfa yenilemelerinden sonra sekme durumunun korunmasını sağlayarak, kullanıcı deneyimini iyileştirmenize yardımcı oldu. Bu yaklaşım, kullanıcıların kaldıkları yerden devam etmelerine olanak tanır ve uygulamanızın kullanılabilirliğini artırır.

Sekme durumunu korumak, özellikle çok sekmeli arayüzlerde ve karmaşık formlarda kullanıcı deneyimini önemli ölçüde iyileştirir. Bu rehberdeki teknikleri kullanarak, kullanıcılarınıza daha iyi bir deneyim sunabilirsiniz.
