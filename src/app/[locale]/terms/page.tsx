import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function TermsPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: 21 de fevereiro de 2026.
      </p>

      <nav className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        <Link href="/refund" className="text-primary hover:underline">
          Política de Reembolso
        </Link>
      </nav>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">1. Aceitação dos Termos</h2>
          <p className="mt-2">
            O Lumyf é um SaaS de gestão financeira colaborativa. Ao utilizar a plataforma,
            você concorda integralmente com estes Termos de Uso. Se não concordar, não utilize o
            serviço.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">2. Descrição do Serviço</h2>
          <p className="mt-2">
            Oferecemos ferramentas para registro de receitas, despesas, metas financeiras,
            investimentos e relatórios, em ambiente colaborativo (workspace) compartilhado com
            membros que você convidar.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">3. Responsabilidades do Usuário</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Fornecer informações verdadeiras e manter dados atualizados.</li>
            <li>Manter sigilo de credenciais de acesso.</li>
            <li>Controlar e revisar quem tem acesso ao workspace.</li>
            <li>Utilizar o serviço de forma lícita e responsável.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">4. Planos e Pagamento</h2>
          <p className="mt-2">
            Planos pagos são faturados via Stripe. Ao assinar, você concorda com as condições de
            cobrança e renovação. Consulte nossa{" "}
            <Link href="/refund" className="text-primary hover:underline">
              Política de Reembolso
            </Link>{" "}
            para solicitações de reembolso.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">5. Modificações</h2>
          <p className="mt-2">
            O serviço pode evoluir com novos recursos, limites e planos. Alterações relevantes
            serão comunicadas pelos canais oficiais. O uso continuado após mudanças constitui
            aceitação dos novos termos.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">6. Rescisão</h2>
          <p className="mt-2">
            Você pode encerrar sua conta a qualquer momento nas configurações. Reservamo-nos o
            direito de suspender ou encerrar contas que violem estes termos.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">7. Isenção de Garantias</h2>
          <p className="mt-2">
            O serviço é fornecido &quot;como está&quot;. Não garantimos disponibilidade contínua ou
            ausência de erros. Recomendamos manter cópias de seus dados em sistemas externos.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">8. Contato</h2>
          <p className="mt-2">
            Dúvidas sobre estes termos: entre em contato pelo e-mail de suporte indicado no app.
          </p>
        </div>
      </section>

      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-primary hover:underline"
      >
        {t("back")}
      </Link>
    </main>
  );
}
