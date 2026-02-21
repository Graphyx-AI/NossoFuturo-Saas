"use client";

import { Link } from "@/i18n/navigation";
import { PRODUCT_CONFIG } from "@/lib/product-config";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Heart,
  PiggyBank,
  Shield,
  Target,
  Users,
  Wallet,
  TrendingUp,
  Menu,
  X,
  ChevronDown,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const NAV_LINKS = ["Funcionalidades", "Preços", "FAQ", "Sobre"];

const FEATURES = [
  {
    icon: Wallet,
    title: "Receitas e Despesas",
    desc: "Registre entradas e saídas por categoria e acompanhe o fluxo de caixa da família em tempo real.",
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    desc: "Defina objetivos como viagem, casa ou reserva de emergência e acompanhe o progresso juntos.",
  },
  {
    icon: TrendingUp,
    title: "Investimentos",
    desc: "Cadastre contas e aplicações e visualize a evolução do patrimônio familiar.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    desc: "Gráficos claros e visão geral para decisões baseadas em dados reais.",
  },
  {
    icon: Users,
    title: "Workspace Compartilhado",
    desc: "Toda a família na mesma página — cada um vê, registra e acompanha junto.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    desc: "Seus dados protegidos com criptografia e autenticação segura.",
  },
];

const PLANS = [
  {
    name: "Pro",
    price: `R$ ${PRODUCT_CONFIG.priceProMonthly.toFixed(2).replace(".", ",")}`,
    period: "/mês",
    desc: `Plano único com ${PRODUCT_CONFIG.trialDays} dias grátis`,
    features: [
      `${PRODUCT_CONFIG.trialDays} dias de teste grátis`,
      `Até ${PRODUCT_CONFIG.maxWorkspaces} workspaces`,
      `Até ${PRODUCT_CONFIG.maxMembersPerWorkspace} membros`,
      "Lançamentos Ilimitados",
      "Metas ilimitadas",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    cta: `Começar ${PRODUCT_CONFIG.trialDays} dias grátis`,
    highlight: true,
  },
];

const STEPS = [
  { num: "01", title: "Crie sua conta", desc: "Em segundos, sem burocracia." },
  { num: "02", title: "Convide a família", desc: "Compartilhe o workspace." },
  { num: "03", title: "Registre tudo", desc: "Receitas, despesas e metas." },
  { num: "04", title: "Cresçam juntos", desc: "Acompanhem o progresso." },
];

const FAQ_ITEMS = [
  {
    q: "O Lumyf é gratuito?",
    a: "Não existe uso gratuito. Para usar o app é obrigatório assinar o plano Pro. Você tem 2 dias de teste grátis e, após esse período, o Stripe cobra automaticamente. Cancele quando quiser.",
  },
  {
    q: "Como funciona o compartilhamento com a família?",
    a: "Cada família cria um workspace e convida membros por e-mail. Todos podem registrar transações, ver relatórios e acompanhar metas. As informações são sincronizadas em tempo real para todos os integrantes.",
  },
  {
    q: "O Lumyf tem alguma ligação com meu banco?",
    a: "Não. O Lumyf não tem nenhuma conexão, integração ou vínculo com sua conta bancária. Todas as transações são cadastradas manualmente por você e sua família. Nós não acessamos, conectamos ou importamos dados de instituições financeiras.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Utilizamos criptografia e autenticação segura. Seus dados financeiros ficam protegidos e apenas as pessoas que você convidar terão acesso ao workspace.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "O pagamento é feito via Stripe (cartão ou PIX). Após os 2 dias de teste grátis, a cobrança é automática. Você pode cancelar a assinatura a qualquer momento no painel de configurações.",
  },
  {
    q: "Quantas pessoas podem usar um workspace?",
    a: "No plano Pro são até 5 membros por workspace.",
  },
];

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            <span className="text-gradient-hero">Lumyf</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                className="transition-colors hover:text-foreground"
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-hero-gradient text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Criar conta
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-foreground hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-5 pb-4 pt-2 space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                className="block text-sm font-medium text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {l}
              </a>
            ))}
            <Link
              href="/register"
              className="block w-full bg-hero-gradient text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg text-center"
            >
              Criar conta
            </Link>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setMobileOpen(false);
              }}
              className="block w-full rounded-lg border border-border px-5 py-2.5 text-center text-sm font-semibold text-foreground"
            >
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-5">
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(160 45% 30%) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <PiggyBank className="h-3.5 w-3.5" />
            Finanças em harmonia para você e sua família
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight mb-6">
            Gestão Financeira Pessoal e Compartilhada —{" "}
            <span className="text-gradient-hero">Teste por {PRODUCT_CONFIG.trialDays} dias grátis</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Registre receitas e despesas, acompanhe investimentos, defina metas financeiras e
            controle seus gastos. Tudo compartilhável ou privado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-hero-gradient text-primary-foreground font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Começar {PRODUCT_CONFIG.trialDays} dias grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#funcionalidades"
              className="text-muted-foreground font-medium flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              Ver como funciona <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 max-w-2xl grid grid-cols-3 gap-6 text-center">
          {[
            ["100%", "Online"],
            [PRODUCT_CONFIG.trialDays + " dias", "Grátis"],
            ["Tempo real", "Sincronizado"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-bold text-gradient-hero">{val}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="py-20 px-5 bg-secondary/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl tracking-tight mb-3">
              Funcionalidades Completas de Gestão Financeira Pessoal
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Controle receitas, despesas, investimentos e metas em um único lugar.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
              >
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"
                  role="img"
                  aria-label={`Ícone de ${f.title}`}
                >
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold mb-2 font-sans">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="sobre" className="py-20 px-5">
        <div className="mx-auto max-w-4xl text-center mb-14">
          <h2 className="text-3xl md:text-4xl tracking-tight mb-3">
            Como Começar a Usar o App de Finanças em 4 Passos
          </h2>
          <p className="text-muted-foreground">
            Setup em minutos. Controle total em horas.
          </p>
        </div>
        <div className="mx-auto max-w-3xl grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s) => (
            <div key={s.num} className="text-center">
              <span className="text-4xl font-bold text-accent/30">{s.num}</span>
              <h3 className="text-base font-semibold mt-2 mb-1 font-sans">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="precos" className="py-20 px-5 bg-secondary/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl tracking-tight mb-3">
              Plano único
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              R$ {PRODUCT_CONFIG.priceProMonthly.toFixed(2).replace(".", ",")} por mês após {PRODUCT_CONFIG.trialDays} dias grátis.
            </p>
          </div>
          <div className="grid md:grid-cols-1 gap-6 max-w-xl mx-auto">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  p.highlight
                    ? "bg-hero-gradient text-primary-foreground shadow-lg scale-[1.03]"
                    : "bg-card shadow-card"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-foreground text-xs font-bold px-4 py-1 rounded-full">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-semibold font-sans">{p.name}</h3>
                <p
                  className={`text-sm mt-1 ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {p.desc}
                </p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span
                    className={`text-sm ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {p.period}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "text-primary-foreground" : "text-primary"}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 text-center block ${
                    p.highlight ? "bg-card text-foreground" : "bg-hero-gradient text-primary-foreground"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-5">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-3">
              <HelpCircle className="h-8 w-8 text-accent" aria-hidden />
              <h2 className="text-3xl md:text-4xl tracking-tight">
                Perguntas Frequentes sobre App de Gestão Financeira
              </h2>
            </div>
            <p className="text-muted-foreground">
              Tire suas dúvidas sobre o Lumyf.
            </p>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-xl bg-card border border-border overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {item.q}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openFaq === i ? "max-h-64" : "max-h-0"
                  }`}
                >
                  <p className="px-5 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Heart className="mx-auto h-10 w-10 text-accent mb-6" fill="currentColor" />
          <h2 className="text-3xl md:text-4xl tracking-tight mb-4">
            Pronto para construir o futuro juntos?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Junte-se a milhares de famílias que já organizam suas finanças com o Lumyf.
          </p>
          <Link
            href="/register"
            className="bg-hero-gradient text-primary-foreground font-semibold px-10 py-4 rounded-xl text-base hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Criar conta <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 px-5">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            Lumyf
          </Link>
          <p>© {new Date().getFullYear()} Lumyf. Todos os direitos reservados.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Termos
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">
              Reembolso
            </Link>
            <Link href="/dashboard/settings#accessibility" className="hover:text-foreground transition-colors">
              Acessibilidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
