import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: 20 de fevereiro de 2026.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          O Nosso Futuro é um SaaS de gestão financeira colaborativa. Ao usar a plataforma,
          você concorda com estes termos, incluindo uso responsável das informações registradas.
        </p>
        <p>
          Você é responsável pela veracidade dos dados inseridos e pelo controle de acesso de
          membros convidados ao seu workspace.
        </p>
        <p>
          O serviço pode evoluir com novos recursos, limites e planos. Mudanças relevantes serão
          comunicadas nos canais oficiais do produto.
        </p>
      </section>

      <a href="/" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
        {t("back")}
      </a>
    </main>
  );
}
