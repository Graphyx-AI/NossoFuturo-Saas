'use client';

import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAllClientes } from '@/lib/clientes';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }) {
  const [clientCounts, setClientCounts] = useState({});
  const { workspace } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const refreshCounts = async () => {
    if (!workspace) {
      setClientCounts({});
      return;
    }

    try {
      const all = await getAllClientes(workspace.id);
      const counts = {};
      for (const id of Object.keys(workspace.niches || {})) {
        counts[id] = all.filter(c => c.nicho === id).length;
      }
      setClientCounts(counts);
    } catch {
      setClientCounts({});
    }
  };

  useEffect(() => {
    refreshCounts();
    const handler = () => refreshCounts();
    window.addEventListener('crm:refresh', handler);
    return () => window.removeEventListener('crm:refresh', handler);
  }, [workspace?.id]);

  const handleNewLead = () => {
    if (!workspace) return;

    const nicheIds = Object.keys(workspace.niches || {});
    const firstNiche = nicheIds[0];
    const fallbackRoute = firstNiche
      ? (firstNiche === 'mvp' ? '/mvp' : `/prospeccao/${firstNiche}`)
      : '/dashboard';

    let target = fallbackRoute;
    if (pathname?.startsWith('/prospeccao/')) {
      target = pathname;
    } else if (pathname === '/mvp') {
      target = '/mvp';
    }

    router.push(`${target}?newLead=1`);
  };

  return (
    <div className="layout">
      <Sidebar clientCounts={clientCounts} />
      <main className="main">
        <button type="button" className="quick-add-lead" onClick={handleNewLead}>
          + Novo Lead
        </button>
        {children}
      </main>
    </div>
  );
}