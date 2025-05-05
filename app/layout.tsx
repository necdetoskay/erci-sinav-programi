import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { UserProvider } from '@/app/context/UserContext';
import { GlobalLoading } from '@/components/ui/global-loading'; // Import GlobalLoading
import { ClientHeadManager } from '@/components/client-head-manager'; // Import ClientHeadManager

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kent Konut A.Ş. ',
  description: 'İş Yerinde Verilen Eğitimler için Sınav Hazırlama Uygulaması',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <UserProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-right" /> {/* position="top-right" eklendi */}
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
        <GlobalLoading /> {/* Add GlobalLoading component */}
        <ClientHeadManager /> {/* Include ClientHeadManager component */}
      </body>
    </html>
  );
}
