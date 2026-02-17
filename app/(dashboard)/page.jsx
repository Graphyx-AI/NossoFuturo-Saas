'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllClientes } from '@/lib/clientes';
import { NICHOS } from '@/lib/config';
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
  negociacao: 'Negociação',
  fechado: 'Fechado',
  recusado: 'Recusado'
};

const STATUS_COLORS = {
  novo: '#E6197A',
  contatado: '#3b82f6',
  interessado: '#22c55e',
  negociacao: '#eab308',
  fechado: '#22c55e',
  recusado: '#ef4444'
};

export default function DashboardPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllClientes();
        setClientes(data);
      } catch (err) {
        console.error(err);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = {
    total: clientes.length,
    fechados: clientes.filter(c => c.status === 'fechado').length,
    interessados: clientes.filter(c => c.status === 'interessado').length,
    novos: clientes.filter(c => c.status === 'novo').length,
    negociacao: clientes.filter(c => c.status === 'negociacao').length,
    recusados: clientes.filter(c => c.status === 'recusado').length
  };

  const porNicho = Object.entries(NICHOS).map(([id, label]) => ({
    nicho: label,
    total: clientes.filter(c => c.nicho === id).length,
    id
  })).filter(d => d.total > 0);

  const porStatus = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: clientes.filter(c => c.status === key).length,
    key
  })).filter(d => d.value > 0);

  if (loading) {
    return <p className="subtitle">Carregando...</p>;
  }

  return (
    <>
      <header>
        <h1>Dashboard</h1>
        <p className="subtitle">Visão geral do CRM GRAPYX</p>
      </header>

      <div className="dashboard-kpis">
        <div className="kpi-card">
          <div className="kpi-value">{metrics.total}</div>
          <div className="kpi-label">Total de Clientes</div>
        </div>
        <div className="kpi-card kpi-success">
          <div className="kpi-value">{metrics.fechados}</div>
          <div className="kpi-label">Deals Fechados</div>
        </div>
        <div className="kpi-card kpi-info">
          <div className="kpi-value">{metrics.interessados}</div>
          <div className="kpi-label">Interessados</div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="kpi-value">{metrics.novos}</div>
          <div className="kpi-label">Novos Leads</div>
        </div>
        <div className="kpi-card kpi-secondary">
          <div className="kpi-value">{metrics.negociacao}</div>
          <div className="kpi-label">Em Negociação</div>
        </div>
        <div className="kpi-card kpi-danger">
          <div className="kpi-value">{metrics.recusados}</div>
          <div className="kpi-label">Recusados</div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Clientes por Status</h3>
          {porStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={porStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  dataKey="value"
                >
                  {porStatus.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#888'} />
                  ))}
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
              <Link
                key={id}
                href={id === 'mvp' ? '/mvp' : `/prospeccao/${id}`}
                className="nicho-card"
              >
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
