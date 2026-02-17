'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NICHOS } from '@/lib/config';
import ThemeToggle from './ThemeToggle';

const SIDEBAR_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/mvp', label: 'MVP', nicho: 'mvp', icon: '🖥️' },
  ...Object.entries(NICHOS)
    .filter(([id]) => id !== 'mvp')
    .map(([id, label]) => ({
      to: `/prospeccao/${id}`,
      label,
      nicho: id,
      icon: '📁'
    }))
];

export default function Sidebar({ clientCounts = {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

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
      {/* HEADER */}
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

        {!collapsed && <h2>GRAPYX CRM</h2>}

        {!collapsed && (
          <div className="sidebar-theme" style={{ marginLeft: '1rem' }}>
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* BODY COM SCROLL */}
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
          {SIDEBAR_ITEMS.map(({ to, label, nicho, icon }) => {
            const isActive =
              to === '/' ? pathname === '/' : pathname.startsWith(to);

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

                    {nicho !== undefined &&
                      clientCounts[nicho] !== undefined && (
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

      {/* FOOTER FIXO */}
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
          <span className="sidebar-icon">🚪</span>
          {!collapsed && <span className="sidebar-label">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
