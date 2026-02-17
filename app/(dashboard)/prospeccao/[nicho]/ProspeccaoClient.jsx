'use client';

import { useState, useEffect, useCallback } from 'react';
import { NICHOS, STATUS_OPTS } from '@/lib/config';
import { getClientes, createCliente, updateCliente, deleteCliente } from '@/lib/clientes';
import Modal from '@/components/ui/Modal';

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function applyFilters(clientes, searchText, statusFilter) {
  let result = clientes;
  const search = (searchText || '').trim().toLowerCase();
  if (search) {
    result = result.filter(c =>
      (c.nome || '').toLowerCase().includes(search) ||
      (c.endereco || '').toLowerCase().includes(search) ||
      (c.telefone || '').toLowerCase().includes(search) ||
      (c.site || '').toLowerCase().includes(search)
    );
  }
  if (statusFilter) {
    result = result.filter(c => (c.status || '') === statusFilter);
  }
  return result;
}

function escapeCsv(str) {
  if (str == null) return '';
  const s = String(str);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ProspeccaoClient({ nicho: nichoProp }) {
  const nicho = nichoProp || 'clinica_estetica';
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  const label = NICHOS[nicho] || nicho;

  useEffect(() => {
    if (!modalOpen) return;
    const formEl = document.getElementById('form-modal-cliente');
    if (!formEl) return;
    const cb = formEl.querySelector('[name="temSite"]');
    const siteInput = formEl.querySelector('[name="site"]');
    if (!cb || !siteInput) return;
    const toggle = () => {
      siteInput.disabled = !cb.checked;
      if (!cb.checked) siteInput.value = '';
    };
    toggle();
    cb.addEventListener('change', toggle);
    return () => cb.removeEventListener('change', toggle);
  }, [modalOpen, editingCliente]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientes(nicho);
      setClientes(data);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:refresh'));
    } catch (err) {
      console.error(err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [nicho]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = applyFilters(clientes, search, filterStatus);
  const semSite = clientes.filter(c => !c.tem_site && !(c.site || '').trim()).length;

  const handleCreate = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const handleEdit = (c) => {
    setEditingCliente(c);
    setModalOpen(true);
  };

  const handleDelete = async (c) => {
    if (!confirm(`Excluir "${c.nome}"?`)) return;
    try {
      await deleteCliente(c.id);
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:refresh'));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const nome = (form.nome?.value || '').trim();
    if (!nome) {
      alert('O campo Nome é obrigatório.');
      return;
    }
    const data = {
      nome,
      telefone: (form.telefone?.value || '').trim(),
      endereco: (form.endereco?.value || '').trim(),
      temSite: form.temSite?.checked || false,
      site: form.temSite?.checked ? (form.site?.value || '').trim() : '',
      status: editingCliente?.status || 'novo',
      observacoes: (form.observacoes?.value || '').trim()
    };

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data);
      } else {
        await createCliente(nicho, data);
      }
      setModalOpen(false);
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:refresh'));
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleStatusChange = async (c, newStatus) => {
    try {
      await updateCliente(c.id, { status: newStatus });
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:refresh'));
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleNotesChange = async (c, value) => {
    try {
      await updateCliente(c.id, { observacoes: value });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const exportCsv = () => {
    const headers = ['nome', 'telefone', 'endereco', 'site', 'status', 'observacoes'];
    const rows = clientes.map(c =>
      headers.map(h => escapeCsv(c[h === 'temSite' ? 'tem_site' : h]))
    );
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prospeccao_${nicho}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <header>
        <h1>{label}</h1>
        <p className="subtitle">Prospecção · {label}</p>
      </header>

      <div className="toolbar">
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Buscar por nome, endereço ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-status"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTS.filter(o => o.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          Adicionar Cliente
        </button>
        <button type="button" className="btn btn-secondary" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="value">{clientes.length}</div>
          <div className="label">Total</div>
        </div>
        <div className="stat-card">
          <div className="value">{filtered.length}</div>
          <div className="label">Exibidos</div>
        </div>
        <div className="stat-card">
          <div className="value">{semSite}</div>
          <div className="label">Sem site</div>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <p className="empty-row-msg">Carregando...</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Endereço</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const tel = (c.telefone || '').trim();
                  const siteUrl = (c.site || '').trim();
                  const temSite = c.tem_site ?? !!siteUrl;
                  return (
                    <tr key={c.id}>
                      <td className="nome">{escapeHtml(c.nome)}</td>
                      <td className={`telefone ${!tel ? 'empty' : ''}`}>
                        {tel ? (
                          <a href={`tel:${tel.replace(/\D/g, '')}`}>{escapeHtml(tel)}</a>
                        ) : (
                          <span className="empty">—</span>
                        )}
                      </td>
                      <td className="endereco">{escapeHtml(c.endereco)}</td>
                      <td className={`site ${!temSite ? 'empty' : ''}`}>
                        {temSite && siteUrl ? (
                          <>
                            <span className="site-ok" title="Tem site">✓</span>
                            <a href={siteUrl.startsWith('http') ? siteUrl : 'https://' + siteUrl} target="_blank" rel="noopener noreferrer">
                              {escapeHtml(siteUrl)}
                            </a>
                          </>
                        ) : (
                          <span className="site-no" title="Não tem site">✗</span>
                        )}
                      </td>
                      <td>
                        <select
                          className={`status-select status-${c.status}`}
                          value={c.status || 'novo'}
                          onChange={e => handleStatusChange(c, e.target.value)}
                        >
                          {STATUS_OPTS.filter(o => o.value).map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="notes-input"
                          defaultValue={c.observacoes || ''}
                          placeholder="Anotações"
                          onBlur={e => handleNotesChange(c, e.target.value)}
                        />
                      </td>
                      <td className="actions">
                        <button
                          type="button"
                          className="btn-icon"
                          title="Editar"
                          onClick={() => handleEdit(c)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          title="Excluir"
                          onClick={() => handleDelete(c)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="empty-row-msg">Nenhum cliente encontrado com esse filtro.</p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Adicionar Cliente'}
      >
        <form id="form-modal-cliente" onSubmit={handleModalSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="modal-nome">Nome *</label>
              <input
                id="modal-nome"
                name="nome"
                type="text"
                required
                placeholder="Nome do cliente"
                defaultValue={editingCliente?.nome}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-telefone">Telefone</label>
              <input
                id="modal-telefone"
                name="telefone"
                type="text"
                placeholder="(21) 99999-9999"
                defaultValue={editingCliente?.telefone}
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-endereco">Endereço</label>
              <input
                id="modal-endereco"
                name="endereco"
                type="text"
                placeholder="Endereço completo"
                defaultValue={editingCliente?.endereco}
              />
            </div>
            <div className="form-check">
              <input
                id="modal-temSite"
                name="temSite"
                type="checkbox"
                defaultChecked={editingCliente?.tem_site ?? !!editingCliente?.site}
              />
              <label htmlFor="modal-temSite">Possui site?</label>
            </div>
            <div className="form-group">
              <label htmlFor="modal-site">Site</label>
              <input
                id="modal-site"
                name="site"
                type="url"
                placeholder="https://"
                defaultValue={editingCliente?.site}
              />
            </div>
            {editingCliente && (
              <div className="form-group">
                <label htmlFor="modal-observacoes">Observações</label>
                <textarea
                  id="modal-observacoes"
                  name="observacoes"
                  rows={3}
                  defaultValue={editingCliente?.observacoes}
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            {editingCliente && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (confirm('Excluir este cliente?')) {
                    handleDelete(editingCliente);
                    setModalOpen(false);
                  }
                }}
              >
                Excluir
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
