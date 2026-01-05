import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'YouTube CTR Evaluator',
  description: 'AI-powered YouTube CTR prediction tool',
=======
  title: 'Next.js + Express + TypeScript',
  description: 'Boilerplate with app router',
>>>>>>> 46cf11a54bcd3e04543fcf0b159a1609058637f7
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
