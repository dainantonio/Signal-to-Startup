import type {Metadata} from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Signal to Startup — Turn Market Signals into Business Ideas',
  description: 'Analyze news, policy, and market signals to identify actionable, low-cost business opportunities. Powered by AI.',
  openGraph: {
    title: 'Signal to Startup',
    description: 'Turn news and market signals into actionable business opportunities. Powered by Gemini AI.',
    type: 'website',
    siteName: 'Signal to Startup',
  },
  twitter: {
    card: 'summary',
    title: 'Signal to Startup',
    description: 'Turn news and market signals into actionable business opportunities. Powered by Gemini AI.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning className="font-sans">{children}</body>
    </html>
  );
}
