const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://lumyf.com";

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Lumyf",
  description:
    "App de gestao financeira pessoal com compartilhamento opcional. Controle receitas, despesas, investimentos e metas.",
  url: BASE_URL.replace(/\/$/, ""),
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, iOS, Android",
  offers: {
    "@type": "Offer",
    name: "Plano unico",
    price: "0",
    priceCurrency: "BRL",
    description: "A integracao de pagamentos esta temporariamente desativada.",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "12000",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: "Lumyf",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "O Lumyf é gratuito?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim. A integracao de pagamentos esta desativada no momento.",
      },
    },
    {
      "@type": "Question",
      name: "Como funciona o compartilhamento com a familia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cada familia cria um workspace e convida membros por e-mail. Todos podem consultar e cadastrar dados em tempo real.",
      },
    },
    {
      "@type": "Question",
      name: "Meus dados estao seguros?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim. Utilizamos criptografia e autenticacao segura. Seus dados financeiros ficam protegidos e apenas as pessoas que voce convidar terao acesso ao workspace.",
      },
    },
  ],
};

export function LandingStructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  );
}
