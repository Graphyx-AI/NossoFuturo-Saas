import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function RefundPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Política de Reembolso</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: 21 de fevereiro de 2026.
      </p>

      <nav className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-primary hover:underline">
          Termos de Uso
        </Link>
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
      </nav>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">1. Período de Teste</h2>
          <p className="mt-2">
            Oferecemos 2 dias de teste gratuito para planos pagos. Durante esse período, você não
            será cobrado. Se cancelar antes do fim do teste, não haverá cobrança.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">2. Direito ao Reembolso</h2>
          <p className="mt-2">
            Dentro de 7 (sete) dias corridos após a cobrança da primeira assinatura, você pode
            solicitar reembolso integral, conforme Código de Defesa do Consumidor (Brasil) e
            diretivas aplicáveis em outros países.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">3. Como Solicitar</h2>
          <p className="mt-2">
            Entre em contato pelo e-mail de suporte indicado no app, informando o e-mail da conta e
            o motivo da solicitação. O reembolso será processado em até 10 dias úteis, via mesmo
            método de pagamento utilizado.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">4. Cancelamento de Assinatura</h2>
          <p className="mt-2">
            Você pode cancelar sua assinatura a qualquer momento pelo Portal do Cliente (Stripe).
            O acesso permanece até o fim do período já pago. Não há reembolso proporcional por
            períodos parciais após os 7 dias iniciais.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">5. Exceções</h2>
          <p className="mt-2">
            Em casos de erro de cobrança, cobrança duplicada ou falha de serviço grave, avaliaremos
            reembolsos individuais mesmo fora do prazo padrão. Entre em contato para análise.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">6. Processamento</h2>
          <p className="mt-2">
            Os pagamentos são processados pelo Stripe. O reembolso aparecerá na sua fatura ou
            extrato em até alguns dias, dependendo da instituição financeira.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">7. Contato</h2>
          <p className="mt-2">
            Dúvidas sobre reembolsos: entre em contato pelo e-mail de suporte indicado no app.
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
