import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import 'node-fetch'; // Keep this if needed by other parts, but NextAuth handles its own fetching
import SessionProviderWrapper from './SessionProviderWrapper'; // Import the wrapper
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clonegram', // Updated title
  description: 'Generate AI images based on Instagram styles', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProviderWrapper>
          {children}
          <Toaster /> {/* Add Toaster here */} 
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
