import { Link } from "@/i18n/navigation";

const PLAN_LIMITS = {
  pro: { workspaces: 3, members: 5, accounts: 10 },
} as const;

const PLAN_PRICES = { pro: 9.9 } as const;

const plan = {
  name: "Pro",
  description: "Plano unico com acesso completo",
  price: PLAN_PRICES.pro,
  features: [
    "7 dias gratis",
    `Ate ${PLAN_LIMITS.pro.workspaces} workspaces`,
    `Ate ${PLAN_LIMITS.pro.members} membros`,
    "Transacoes ilimitadas",
    "Metas ilimitadas",
    `${PLAN_LIMITS.pro.accounts} contas`,
  ],
  cta: "Criar conta",
  href: "/register",
};

export function LandingPricing() {
  return (
    <section id="planos" className="py-20 sm:py-28 scroll-mt-20" aria-labelledby="planos-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 id="planos-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-4">
          Plano e preco
        </h2>
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-14">
          Um unico plano para simplificar. Sem integracao de pagamentos por enquanto.
        </p>
        <div className="max-w-xl mx-auto">
          <article className="relative rounded-2xl p-6 sm:p-8 flex flex-col bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-xl shadow-violet-500/25">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-violet-600 text-xs font-bold px-3 py-1 rounded-full">
              Plano unico
            </span>
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-sm mb-6 text-white/90">{plan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
              <span className="text-white/80">/mes</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-white/95">
                  <span className="text-green-200" aria-hidden>
                    *
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className="block w-full text-center font-bold py-3.5 rounded-xl transition-all bg-white text-violet-600 hover:bg-slate-50"
            >
              {plan.cta}
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
