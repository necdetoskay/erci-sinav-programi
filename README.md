# Next.js Fullstack Template

Modern, ölçeklenebilir ve güvenli bir Next.js fullstack uygulama şablonu.

## 🚀 Özellikler

- ⚡️ Next.js 14 App Router
- 🔐 NextAuth.js ile kimlik doğrulama
- 🎨 Tailwind CSS ile modern UI
- 📦 Prisma ORM ile veritabanı yönetimi
- 🔄 TypeScript ile tip güvenliği
- 🛡️ ESLint ile kod kalitesi
- 📱 Responsive tasarım
- 🎭 Radix UI bileşenleri
- 📝 Form yönetimi (React Hook Form + Zod)
- 🔔 Bildirimler (Sonner)
- 🐳 Docker desteği

## 📋 Gereksinimler

- Node.js 18.17 veya üzeri
- npm veya yarn
- Docker (opsiyonel)

## 🛠️ Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/yourusername/nextjs-fullstack-template.git
cd nextjs-fullstack-template
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. .env dosyasını oluşturun:
```bash
cp .env.example .env
```

4. Veritabanını başlatın:
```bash
npm run db:push
```

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## 📁 Proje Yapısı

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (auth)/            # Kimlik doğrulama sayfaları
│   ├── dashboard/         # Dashboard sayfaları
│   └── ...
├── components/            # React bileşenleri
│   ├── ui/               # UI bileşenleri
│   └── ...
├── lib/                  # Yardımcı fonksiyonlar
├── prisma/              # Prisma şeması
├── providers/           # Context providers
└── public/             # Statik dosyalar
```

## 🔧 Kullanılan Teknolojiler

- [Next.js](https://nextjs.org/) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Kimlik doğrulama
- [Prisma](https://www.prisma.io/) - ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI bileşenleri
- [React Hook Form](https://react-hook-form.com/) - Form yönetimi
- [Zod](https://zod.dev/) - Şema doğrulama
- [Sonner](https://sonner.emilkowal.ski/) - Bildirimler

## 📝 Veritabanı Şeması

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## 🔒 Güvenlik

- CSRF koruması
- XSS koruması
- Rate limiting
- Input doğrulama
- Güvenli oturum yönetimi

## 🧪 Test

```bash
# Testleri çalıştır
npm test

# Test coverage raporu
npm run test:coverage
```

## 🚀 Deployment

1. Production build alın:
```bash
npm run build
```

2. Production sunucusunu başlatın:
```bash
npm start
```

## 📄 Lisans

MIT

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'Add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## İletişim

Proje Sahibi - [@necdetoskay](https://twitter.com/yourusername)

Proje Linki: [https://github.com/yourusername/nextjs-fullstack-template](https://github.com/necdetoskay/nextjs-fullstack-template)
