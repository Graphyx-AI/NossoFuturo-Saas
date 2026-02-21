"use client";

import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" aria-label="Principal">
        <Link href="/" className="flex items-center gap-2 text-foreground font-bold text-xl hover:opacity-90 transition-opacity">
          <Heart className="h-6 w-6 text-accent" fill="currentColor" aria-hidden />
          <span className="text-gradient-hero">Lumyf</span>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          <a href="#produto" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
            Produto
          </a>
          <a href="#planos" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
            Planos
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-muted-foreground font-semibold hover:text-foreground transition-colors px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-hero-gradient text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Cadastrar
          </Link>
        </div>
      </nav>
    </header>
  );
}
