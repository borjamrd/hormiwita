import type {Metadata} from 'next';
import {Geist, Geist_Mono, Lora} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import NavBar from '@/components/nav-bar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'hormiwita',
  description: 'Your personal finance and banking AI assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`} suppressHydrationWarning>
        <NavBar/>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
