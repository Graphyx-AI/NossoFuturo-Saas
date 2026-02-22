'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAllClientes } from '@/lib/clientes';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const STATUS_LABELS = {
  novo: 'Novo',
  contatado: 'Contatado',
  interessado: 'Interessado',
  negociacao: 'Negociacao',
  fechado: 'Fechado',
  recusado: 'Recusado',
  testando: 'Testando',
  cliente: 'Cliente',
  perdido: 'Perdido'
};

const STATUS_COLORS = {
  novo: '#E6197A',
  contatado: '#3b82f6',
  interessado: '#22c55e',
  negociacao: '#eab308',
  fechado: '#22c55e',
  recusado: '#ef4444',
  testando: '#f59e0b',
  cliente: '#10b981',
  perdido: '#ef4444'
};

function buildStatusSeries(clientes) {
  return Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({
      name: label,
      value: clientes.filter(c => c.status === key).length,
      key
    }))
    .filter(d => d.value > 0);
}

function buildNicheSeries(clientes, niches) {
  return Object.entries(niches)
    .map(([id, label]) => ({
      nicho: label,
      total: clientes.filter(c => c.nicho === id).length,
      id
    }))
    .filter(d => d.total > 0);
}

function GraphyxDashboard({ clientes, porNicho, porStatus }) {
  const metrics = {
    total: clientes.length,
    fechados: clientes.filter(c => c.status === 'fechado').length,
    interessados: clientes.filter(c => c.status === 'interessado').length,
    novos: clientes.filter(c => c.status === 'novo').length,
    negociacao: clientes.filter(c => c.status === 'negociacao').length,
    recusados: clientes.filter(c => c.status === 'recusado').length
  };

  return (
    <>
      <header>
        <h1>Dashboard</h1>
        <p className="subtitle">Visao geral do CRM GRAPYX</p>
      </header>

      <div className="dashboard-kpis">
        <div className="kpi-card"><div className="kpi-value">{metrics.total}</div><div className="kpi-label">Total de Clientes</div></div>
        <div className="kpi-card kpi-success"><div className="kpi-value">{metrics.fechados}</div><div className="kpi-label">Deals Fechados</div></div>
        <div className="kpi-card kpi-info"><div className="kpi-value">{metrics.interessados}</div><div className="kpi-label">Interessados</div></div>
        <div className="kpi-card kpi-warning"><div className="kpi-value">{metrics.novos}</div><div className="kpi-label">Novos Leads</div></div>
        <div className="kpi-card kpi-secondary"><div className="kpi-value">{metrics.negociacao}</div><div className="kpi-label">Em Negociacao</div></div>
        <div className="kpi-card kpi-danger"><div className="kpi-value">{metrics.recusados}</div><div className="kpi-label">Recusados</div></div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Clientes por Status</h3>
          {porStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={porStatus} cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                  {porStatus.map((entry) => (<Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#888'} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">Nenhum dado para exibir</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Clientes por Nicho</h3>
          {porNicho.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porNicho} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nicho" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#E6197A" name="Clientes" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">Nenhum dado para exibir</p>
          )}
        </div>
      </div>

      {porNicho.length > 0 && (
        <div className="dashboard-nichos">
          <h3>Resumo por Nicho</h3>
          <div className="nicho-cards">
            {porNicho.map(({ id, nicho, total }) => (
              <Link key={id} href={id === 'mvp' ? '/mvp' : `/prospeccao/${id}`} className="nicho-card">
                <span className="nicho-label">{nicho}</span>
                <span className="nicho-count">{total}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function LumyfDashboard({ clientes, porStatus }) {
  const total = clientes.length;
  const contatados = clientes.filter(c => c.status === 'contatado').length;
  const fechados = clientes.filter(c => c.status === 'cliente' || c.status === 'fechado').length;
  const semSite = clientes.filter(c => !c.tem_site && !(c.site || '').trim()).length;
  const taxaFechamento = total > 0 ? Math.round((fechados / total) * 100) : 0;
  const taxaContato = total > 0 ? Math.round((contatados / total) * 100) : 0;

  return (
    <>
      <header>
        <h1>Dashboard Lumyf</h1>
        <p className="subtitle">Visao do projeto CRM Lumyf</p>
      </header>

      <div className="dashboard-kpis">
        <div className="kpi-card"><div className="kpi-value">{total}</div><div className="kpi-label">Leads no Workspace</div></div>
        <div className="kpi-card kpi-info"><div className="kpi-value">{contatados}</div><div className="kpi-label">Contatados</div></div>
        <div className="kpi-card kpi-success"><div className="kpi-value">{fechados}</div><div className="kpi-label">Fechados</div></div>
        <div className="kpi-card kpi-warning"><div className="kpi-value">{semSite}</div><div className="kpi-label">Sem Site</div></div>
        <div className="kpi-card kpi-secondary"><div className="kpi-value">{taxaContato}%</div><div className="kpi-label">Taxa de Contato</div></div>
        <div className="kpi-card kpi-danger"><div className="kpi-value">{taxaFechamento}%</div><div className="kpi-label">Taxa de Fechamento</div></div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Pipeline do CRM Lumyf</h3>
          {porStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={porStatus} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" name="Leads" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">Nenhum dado para exibir</p>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { workspace } = useAuth();

  useEffect(() => {
    async function load() {
      if (!workspace) {
        setClientes([]);
        setLoading(false);
        return;
      }

      try {
        const data = await getAllClientes(workspace.id);
        setClientes(data);
      } catch (err) {
        console.error(err);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workspace?.id]);

  const porStatus = useMemo(() => buildStatusSeries(clientes), [clientes]);
  const porNicho = useMemo(
    () => buildNicheSeries(clientes, workspace?.niches || {}),
    [clientes, workspace?.id]
  );

  if (loading) {
    return <p className="subtitle">Carregando...</p>;
  }

  if (!workspace) {
    return <p className="subtitle">Workspace nao encontrado para este usuario.</p>;
  }

  if (workspace.dashboardVariant === 'lumyf') {
    return <LumyfDashboard clientes={clientes} porStatus={porStatus} />;
  }

  return <GraphyxDashboard clientes={clientes} porNicho={porNicho} porStatus={porStatus} />;
}
