import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PrivacyPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: 21 de fevereiro de 2026.
      </p>

      <nav className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-primary hover:underline">
          Termos de Uso
        </Link>
        <Link href="/refund" className="text-primary hover:underline">
          Política de Reembolso
        </Link>
      </nav>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">1. Controlador de Dados</h2>
          <p className="mt-2">
            O Lumyf atua como controlador dos dados pessoais que você fornece ao usar a
            plataforma. Processamos seus dados em conformidade com a LGPD (Lei Geral de Proteção de
            Dados, Brasil) e o GDPR (Regulamento Geral sobre Proteção de Dados, UE/EEE), conforme
            aplicável.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">2. Dados que Coletamos</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Autenticação:</strong> e-mail, nome, foto (se fornecido via provedor OAuth).
            </li>
            <li>
              <strong>Operação:</strong> transações, categorias, metas, orçamentos e dados
              financeiros que você cadastra.
            </li>
            <li>
              <strong>Localização:</strong> opcional, apenas com seu consentimento explícito, para
              melhorar experiência (timezone, contexto regional).
            </li>
            <li>
              <strong>Pagamentos:</strong> dados de cobrança tratados pelo Stripe (veja a política
              deles).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">3. Finalidade e Base Legal</h2>
          <p className="mt-2">
            Utilizamos seus dados para: prestar o serviço, processar pagamentos, dar suporte e
            cumprir obrigações legais. A base legal inclui execução de contrato, consentimento (ex.:
            localização) e legítimo interesse (segurança, melhorias).
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">4. Compartilhamento</h2>
          <p className="mt-2">
            Seus dados são vinculados ao workspace e compartilhados apenas com membros que você
            convidar. Utilizamos Supabase (banco) e Stripe (pagamentos) como processadores; eles
            seguem políticas de privacidade e acordos de tratamento.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">5. Segurança</h2>
          <p className="mt-2">
            Adotamos criptografia, autenticação segura e controles de acesso. Dados financeiros são
            protegidos por políticas de segurança dos provedores e boas práticas de desenvolvimento.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">6. Seus Direitos (LGPD / GDPR)</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Acessar e exportar seus dados.</li>
            <li>Corrigir dados incorretos.</li>
            <li>Solicitar exclusão dos seus dados pessoais.</li>
            <li>Revogar consentimento (ex.: localização).</li>
            <li>Opor-se a certos tratamentos.</li>
            <li>Portabilidade dos dados (formato estruturado).</li>
          </ul>
          <p className="mt-2">
            Para exercer seus direitos, use as configurações do app ou entre em contato pelo e-mail
            de suporte. Usuários da UE/EEE têm o direito de apresentar reclamação à autoridade de
            proteção de dados competente.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">7. Retenção</h2>
          <p className="mt-2">
            Mantemos seus dados enquanto a conta estiver ativa. Após exclusão da conta, removemos
            dados pessoais em até 30 dias, salvo exigência legal de retenção.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">8. Transferência Internacional</h2>
          <p className="mt-2">
            Dados podem ser processados em servidores fora do seu país. Garantimos salvaguardas
            adequadas (cláusulas contratuais padrão ou equivalentes) quando aplicável.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">9. Cookies e Tecnologias</h2>
          <p className="mt-2">
            Utilizamos cookies essenciais para autenticação e funcionamento do app. Não usamos
            cookies de marketing sem seu consentimento explícito.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">10. Alterações</h2>
          <p className="mt-2">
            Atualizações desta política serão publicadas nesta página com nova data. Alterações
            relevantes serão comunicadas por e-mail ou no app.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">11. Contato</h2>
          <p className="mt-2">
            Para questões de privacidade ou exercício de direitos: entre em contato pelo e-mail de
            suporte indicado no app.
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
