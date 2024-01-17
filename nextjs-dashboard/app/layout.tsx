// import global.css. THis adds CSS rules to all routes in application, can add this to any component, but good practice to add to top level. Next,js this is root layout
import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The offical Next.js Course Dashboard, built with App Router.',
  metadataBase: new URL('https://nextjs-dashboard-practice-pi.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
