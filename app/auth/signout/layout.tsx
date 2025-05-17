import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çıkış Yap | Kent Konut Sınav Portalı",
  description: "Kent Konut Sınav Portalı'ndan güvenli çıkış yapın",
};

export default function SignOutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
