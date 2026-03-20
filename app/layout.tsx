import type {Metadata} from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Brand Builder App',
  description: 'Visualize your product across different mediums.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="font-sans bg-[#F4F5F0] text-[#0F4C81] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
