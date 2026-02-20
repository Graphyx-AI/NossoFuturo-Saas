import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: 20 de fevereiro de 2026.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Coletamos apenas os dados necessários para autenticação, operação do produto e suporte.
        </p>
        <p>
          Dados financeiros são vinculados ao workspace e protegidos por autenticação, políticas de
          acesso e regras de segurança do banco.
        </p>
        <p>
          A localização é opcional e usada apenas para melhorar experiência local (ex.: timezone e
          contexto regional), conforme consentimento do usuário.
        </p>
      </section>

      <a href="/" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
        {t("back")}
      </a>
    </main>
  );
}
