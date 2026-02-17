'use client';

import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { getAllClientes } from '@/lib/clientes';
import { NICHOS } from '@/lib/config';

export default function DashboardLayout({ children }) {
  const [clientCounts, setClientCounts] = useState({});

  const refreshCounts = async () => {
    try {
      const all = await getAllClientes();
      const counts = {};
      for (const id of Object.keys(NICHOS)) {
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
  }, []);

  return (
    <div className="layout">
      <Sidebar clientCounts={clientCounts} />
      <main className="main">
        {children}
      </main>
    </div>
  );
}
