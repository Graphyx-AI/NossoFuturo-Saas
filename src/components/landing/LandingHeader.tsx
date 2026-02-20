"use client";

import { Link } from "@/i18n/navigation";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" aria-label="Principal">
        <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold text-xl hover:opacity-90 transition-opacity">
          <span className="text-2xl" aria-hidden>💍</span>
          <span>Nosso Futuro</span>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          <a href="#produto" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Produto
          </a>
          <a href="#planos" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Planos
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-slate-700 font-semibold hover:text-violet-600 transition-colors px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="btn-primary px-5 py-2.5 rounded-xl text-sm shadow-md"
          >
            Cadastrar
          </Link>
        </div>
      </nav>
    </header>
  );
}
