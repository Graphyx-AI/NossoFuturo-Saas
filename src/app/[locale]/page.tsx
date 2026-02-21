import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { LandingStructuredData } from "@/components/landing/LandingStructuredData";

export const metadata: Metadata = {
  title: "Lumyf - App Gestão Financeira Pessoal | Grátis",
  description:
    "App de gestão financeira pessoal com compartilhamento flexível. Controle receitas, despesas, investimentos e metas. Comece grátis, sem limite de tempo.",
  keywords: [
    "app gestão financeira",
    "controle gastos",
    "app orçamento pessoal",
    "gestão investimentos",
    "app finanças grátis",
  ],
  authors: [{ name: "Lumyf" }],
  openGraph: {
    title: "Lumyf - Gestão Financeira Pessoal Compartilhada",
    description:
      "Organize suas finanças pessoais e compartilhe com quem quiser. Controle receitas, despesas e metas em tempo real.",
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Lumyf",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lumyf - App de Gestão Financeira Pessoal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumyf - Gestão Financeira Pessoal",
    description: "App gratuito para controlar suas finanças pessoais.",
    images: ["/og-image.jpg"],
  },
  robots: "index, follow",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <LandingStructuredData />
      <LandingPage />
    </>
  );
}
