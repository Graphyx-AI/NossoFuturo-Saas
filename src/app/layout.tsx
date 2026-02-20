import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AccessibilityProvider } from "@/components/accessibility-provider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e6b5c" },
    { media: "(prefers-color-scheme: dark)", color: "#2d9d7a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : new URL("https://nosso-futuro.com"),
  title: {
    default: "Nosso Futuro - Finanças para Casal e Família",
    template: "%s | Nosso Futuro",
  },
  description:
    "Gestão inteligente das suas finanças. Controle receitas, despesas, investimentos e metas.",
  keywords: ["finanças pessoais", "controle financeiro", "finanças para casal", "app finanças"],
  openGraph: { locale: "pt_BR" },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} antialiased min-h-screen overflow-x-hidden`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('nosso-futuro-theme');var r=document.documentElement;if(t==='dark'){r.classList.add('dark')}else{r.classList.remove('dark')}}catch(e){}})();",
          }}
        />
        <ThemeProvider>
          <AccessibilityProvider>{children}</AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
