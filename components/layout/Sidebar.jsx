'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const NICHE_ICONS = {
  // Lumyf channels
  reddit: '👽',
  youtube: '▶️',
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  lp: '🧾',
  ommigle: '💬',
  grupos: '👥',
  outros: '📦',
  // Graphyx niches
  psicologo: '🧠',
  imobiliaria: '🏠',
  curso_online: '🎓',
  dentista: '🦷',
  clinica_estetica: '✨',
  barbearia: '💈',
  empresa_limpeza: '🧹',
  coach: '🎯',
  turismo_excursao: '🧳',
  mvp: '🚀'
};

function getNicheIcon(id) {
  return NICHE_ICONS[id] || '📁';
}

export default function Sidebar({ clientCounts = {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut, workspace } = useAuth();
  const router = useRouter();

  const sidebarItems = useMemo(() => {
    const niches = workspace?.niches || {};
    const base = [{ to: '/dashboard', label: 'Dashboard', icon: '\u{1F4CA}' }];

    return [
      ...base,
      ...Object.entries(niches).map(([id, label]) => ({
        to: id === 'mvp' ? '/mvp' : `/prospeccao/${id}`,
        label,
        nicho: id,
        icon: getNicheIcon(id)
      }))
    ];
  }, [workspace]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCollapsed(sessionStorage.getItem('sidebar-collapsed') === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sidebar-collapsed', collapsed);
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}
    >
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir' : 'Recolher'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? '›' : '‹'}
        </button>

        {!collapsed && <h2>{workspace?.appLabel || 'CRM'}</h2>}

        {!collapsed && (
          <div className="sidebar-theme" style={{ marginLeft: '1rem' }}>
            <ThemeToggle />
          </div>
        )}
      </div>

      <div
        className="sidebar-body"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}
      >
        <nav
          className="sidebar-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {sidebarItems.map(({ to, label, nicho, icon }) => {
            const isActive = pathname === to || pathname.startsWith(`${to}/`);

            return (
              <Link
                key={to}
                href={to}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{icon}</span>

                {!collapsed && (
                  <>
                    <span className="sidebar-label">{label}</span>

                    {nicho !== undefined && clientCounts[nicho] !== undefined && (
                      <span className="sidebar-count">
                        {clientCounts[nicho]}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        className="sidebar-footer"
        style={{
          borderTop: '1px solid var(--border-color, #222)',
          padding: '1rem'
        }}
      >
        <button
          type="button"
          className="sidebar-item sidebar-logout"
          onClick={handleLogout}
          title="Sair"
          style={{ width: '100%' }}
        >
          <span className="sidebar-icon">{'\u{1F6AA}'}</span>
          {!collapsed && <span className="sidebar-label">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
