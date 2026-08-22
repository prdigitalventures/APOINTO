import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Apointo - AI-Powered Booking Platform',
  description: 'Tell us about your business. AI builds your booking system.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0d12] dark:text-gray-100">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('apointo-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
