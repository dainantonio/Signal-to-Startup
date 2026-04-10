import type {Metadata} from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles
import ConsoleEasterEgg from '@/components/ConsoleEasterEgg'

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
  title: 'Signal to Startup — Turn News Into Your Next Business',
  description:
    'Signal to Startup reads the news so you do not have to. Every article is a market signal. We find the hidden business opportunity inside it — with a full execution plan, costs in your currency, and funding sources specific to your market. US, Caribbean, Africa, UK, Latin America.',
  keywords: [
    'startup ideas',
    'business opportunities',
    'market signals',
    'entrepreneur tool',
    'AI business ideas',
    'small business',
    'Jamaica business',
    'Nigeria startup',
    'Caribbean entrepreneur',
    'business plan generator',
    'grant finder',
    'startup funding',
    'side hustle ideas',
    'business signal',
    'EntrepAIneur',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Signal to Startup',
  },
  openGraph: {
    title: 'Signal to Startup — Turn News Into Your Next Business',
    description:
      "AI-powered market intelligence for entrepreneurs. Find business opportunities in today's news — with local costs, grants, and a full execution plan.",
    url: 'https://signal-to-startup.vercel.app',
    siteName: 'Signal to Startup',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Signal to Startup',
    description: 'Turn any news story into a business opportunity. Built for entrepreneurs everywhere.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'signal-to-startup':
      'You found us. Email hello@entrepaIneur.com with subject "I found the source" for early access.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f0f0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Signal to Startup" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        <ConsoleEasterEgg />
        {children}
      </body>
    </html>
  );
}
