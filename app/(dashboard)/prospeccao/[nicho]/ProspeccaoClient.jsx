'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getClientes, createCliente, updateCliente, deleteCliente } from '@/lib/clientes';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';

const GRAPHYX_STATUS_OPTS = [
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'negociacao', label: 'Negociacao' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'recusado', label: 'Recusado' }
];

const LUMYF_STATUS_OPTS = [
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'testando', label: 'Testando' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'perdido', label: 'Perdido' }
];

function normalizeDateValue(value) {
  if (!value) return '';
  const str = String(value);
  if (str.length >= 10) return str.slice(0, 10);
  return '';
}

function normalizeDateTimeLocalValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR');
}

function getNumberOrNull(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getIntOrNull(raw) {
  const n = getNumberOrNull(raw);
  if (n == null) return null;
  return Math.trunc(n);
}

function applyFilters(clientes, searchText, statusFilter) {
  let result = clientes;
  const search = (searchText || '').trim().toLowerCase();
  if (search) {
    result = result.filter(c =>
      (c.nome || '').toLowerCase().includes(search) ||
      (c.endereco || '').toLowerCase().includes(search) ||
      (c.telefone || '').toLowerCase().includes(search) ||
      (c.site || '').toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search) ||
      (c.whatsapp || '').toLowerCase().includes(search) ||
      (c.origemLead || '').toLowerCase().includes(search) ||
      (c.responsavelAtendimento || '').toLowerCase().includes(search)
    );
  }
  if (statusFilter) {
    result = result.filter(c => (c.status || '') === statusFilter);
  }
  return result;
}

export default function ProspeccaoClient({ nicho: nichoProp }) {
  const { workspace } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const availableNiches = workspace?.niches || {};
  const firstNiche = useMemo(() => Object.keys(availableNiches)[0] || null, [workspace?.id]);
  const isLumyf = workspace?.dashboardVariant === 'lumyf';
  const statusOptions = isLumyf ? LUMYF_STATUS_OPTS : GRAPHYX_STATUS_OPTS;

  const nicho = useMemo(() => {
    if (!workspace) return null;
    if (nichoProp && availableNiches[nichoProp]) return nichoProp;
    return firstNiche;
  }, [workspace?.id, nichoProp, firstNiche]);

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  const label = nicho ? availableNiches[nicho] || nicho : '';

  useEffect(() => {
    if (!modalOpen || isLumyf) return;
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
  }, [modalOpen, editingCliente, isLumyf]);

  const load = useCallback(async () => {
    if (!workspace || !nicho) {
      setClientes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getClientes(nicho, workspace.id);
      setClientes(data);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:refresh'));
    } catch (err) {
      console.error(err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, nicho]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!workspace || !nicho) return;
    if (searchParams?.get('newLead') !== '1') return;

    setEditingCliente(null);
    setModalOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('newLead');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [workspace?.id, nicho, searchParams, pathname, router]);

  const filtered = applyFilters(clientes, search, filterStatus);
  const semSite = clientes.filter(c => !c.tem_site && !(c.site || '').trim()).length;
  const emFollowup = clientes.filter(c => !!c.proximoFollowUp).length;

  const handleCreate = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const handleEdit = c => {
    setEditingCliente(c);
    setModalOpen(true);
  };

  const handleDelete = async c => {
    if (!confirm(`Excluir "${c.nome}"?`)) return;
    try {
      await deleteCliente(c.id);
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:refresh'));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleModalSubmit = async e => {
    e.preventDefault();
    const form = e.target;
    const nome = (form.nome?.value || '').trim();
    if (!nome) {
      alert('O campo Nome e obrigatorio.');
      return;
    }

    if (!workspace || !nicho) {
      alert('Workspace invalido.');
      return;
    }

    let data;
    if (isLumyf) {
      const prob = getIntOrNull(form.probabilidadeFechamento?.value);
      data = {
        nome,
        email: (form.email?.value || '').trim(),
        whatsapp: (form.whatsapp?.value || '').trim(),
        telefone: (form.telefone?.value || '').trim(),
        empresa: (form.empresa?.value || '').trim(),
        cargo: (form.cargo?.value || '').trim(),
        cidade: (form.cidade?.value || '').trim(),
        pais: (form.pais?.value || '').trim(),
        comoConheceu: (form.comoConheceu?.value || '').trim(),
        status: (form.status?.value || editingCliente?.status || 'novo').trim(),
        planoInteresse: (form.planoInteresse?.value || '').trim(),
        valorPotencial: getNumberOrNull(form.valorPotencial?.value),
        dataPrimeiroContato: normalizeDateValue(form.dataPrimeiroContato?.value),
        responsavelAtendimento: (form.responsavelAtendimento?.value || '').trim(),
        probabilidadeFechamento: prob == null ? null : Math.max(0, Math.min(prob, 100)),
        tipoCliente: (form.tipoCliente?.value || '').trim(),
        maiorDificuldadeFinanceira: (form.maiorDificuldadeFinanceira?.value || '').trim(),
        usaPlanilhaOuApp: !!form.usaPlanilhaOuApp?.checked,
        qtdUsuarios: getIntOrNull(form.qtdUsuarios?.value),
        precisaWorkspaceCompartilhado: !!form.precisaWorkspaceCompartilhado?.checked,
        ultimoContato: form.ultimoContato?.value || null,
        proximoFollowUp: form.proximoFollowUp?.value || null,
        canalContato: (form.canalContato?.value || '').trim(),
        observacoesConversa: (form.observacoesConversa?.value || '').trim(),
        observacoes: (form.observacoesConversa?.value || '').trim(),
        criouConta: !!form.criouConta?.checked,
        dataCadastro: normalizeDateValue(form.dataCadastro?.value),
        estaNoTrial: !!form.estaNoTrial?.checked,
        planoAtual: (form.planoAtual?.value || '').trim(),
        dataRenovacao: normalizeDateValue(form.dataRenovacao?.value),
        cancelou: !!form.cancelou?.checked,
        motivoCancelamento: (form.motivoCancelamento?.value || '').trim(),
        origemLead: (form.origemLead?.value || '').trim(),
        campanha: (form.campanha?.value || '').trim(),
        afiliado: (form.afiliado?.value || '').trim()
      };
    } else {
      data = {
        nome,
        telefone: (form.telefone?.value || '').trim(),
        endereco: (form.endereco?.value || '').trim(),
        temSite: form.temSite?.checked || false,
        site: form.temSite?.checked ? (form.site?.value || '').trim() : '',
        status: (form.status?.value || editingCliente?.status || 'novo').trim(),
        observacoes: (form.observacoes?.value || '').trim()
      };
    }

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data);
      } else {
        await createCliente(nicho, data, workspace.id);
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
      const payload = isLumyf
        ? { observacoesConversa: value, observacoes: value }
        : { observacoes: value };
      await updateCliente(c.id, payload);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (!workspace) {
    return <p className="subtitle">Workspace nao encontrado para este usuario.</p>;
  }

  if (!nicho) {
    return <p className="subtitle">Nenhum nicho configurado para este workspace.</p>;
  }

  return (
    <>
      <header>
        <h1>{label}</h1>
        <p className="subtitle">{isLumyf ? `Lumyf CRM · ${label}` : `Prospeccao · ${label}`}</p>
      </header>

      <div className="toolbar">
        <div className="search-wrap">
          <input
            type="text"
            placeholder={isLumyf ? 'Buscar por nome, email, WhatsApp, origem...' : 'Buscar por nome, endereco ou telefone...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          {isLumyf ? 'Adicionar Lead' : 'Adicionar Cliente'}
        </button>
      </div>

      <div className="stats">
        <div className="stat-card"><div className="value">{clientes.length}</div><div className="label">Total</div></div>
        <div className="stat-card"><div className="value">{filtered.length}</div><div className="label">Exibidos</div></div>
        <div className="stat-card">
          <div className="value">{isLumyf ? emFollowup : semSite}</div>
          <div className="label">{isLumyf ? 'Com follow-up' : 'Sem site'}</div>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <p className="empty-row-msg">Carregando...</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                {isLumyf ? (
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>Tipo de cliente</th>
                    <th>Origem</th>
                    <th>Status</th>
                    <th>Plano interesse</th>
                    <th>Responsavel</th>
                    <th>Ultimo contato</th>
                    <th>Proximo contato</th>
                    <th>Observacoes</th>
                    <th>Acoes</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Endereco</th>
                    <th>Site</th>
                    <th>Status</th>
                    <th>Observacoes</th>
                    <th>Acoes</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filtered.map(c => {
                  const tel = (c.telefone || c.whatsapp || '').trim();
                  const siteUrl = (c.site || '').trim();
                  const temSite = c.tem_site ?? !!siteUrl;
                  return (
                    <tr key={c.id}>
                      {isLumyf ? (
                        <>
                          <td className="nome">{c.nome}</td>
                          <td>{c.email || '-'}</td>
                          <td className={`telefone ${!tel ? 'empty' : ''}`}>
                            {tel ? <a href={`tel:${tel.replace(/\D/g, '')}`}>{tel}</a> : <span className="empty">-</span>}
                          </td>
                          <td>{c.tipoCliente || '-'}</td>
                          <td>{c.origemLead || '-'}</td>
                          <td>
                            <select className={`status-select status-${c.status}`} value={c.status || 'novo'} onChange={e => handleStatusChange(c, e.target.value)}>
                              {statusOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>{c.planoInteresse || '-'}</td>
                          <td>{c.responsavelAtendimento || '-'}</td>
                          <td>{formatDateTime(c.ultimoContato)}</td>
                          <td>{formatDateTime(c.proximoFollowUp)}</td>
                          <td>
                            <input
                              type="text"
                              className="notes-input"
                              defaultValue={c.observacoesConversa || c.observacoes || ''}
                              placeholder="Observacoes"
                              onBlur={e => handleNotesChange(c, e.target.value)}
                            />
                          </td>
                          <td className="actions">
                            <button type="button" className="btn-icon" title="Editar" onClick={() => handleEdit(c)}>{'\u270E'}</button>
                            <button type="button" className="btn-icon btn-danger" title="Excluir" onClick={() => handleDelete(c)}>{'\u{1F5D1}'}</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="nome">{c.nome}</td>
                          <td className={`telefone ${!tel ? 'empty' : ''}`}>
                            {tel ? <a href={`tel:${tel.replace(/\D/g, '')}`}>{tel}</a> : <span className="empty">-</span>}
                          </td>
                          <td className="endereco">{c.endereco}</td>
                          <td className={`site ${!temSite ? 'empty' : ''}`}>
                            {temSite && siteUrl ? (
                              <>
                                <span className="site-ok" title="Tem site">{'\u2713'}</span>
                                <a href={siteUrl.startsWith('http') ? siteUrl : 'https://' + siteUrl} target="_blank" rel="noopener noreferrer">
                                  {siteUrl}
                                </a>
                              </>
                            ) : (
                              <span className="site-no" title="Nao tem site">{'\u2717'}</span>
                            )}
                          </td>
                          <td>
                            <select className={`status-select status-${c.status}`} value={c.status || 'novo'} onChange={e => handleStatusChange(c, e.target.value)}>
                              {statusOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="notes-input"
                              defaultValue={c.observacoes || ''}
                              placeholder="Anotacoes"
                              onBlur={e => handleNotesChange(c, e.target.value)}
                            />
                          </td>
                          <td className="actions">
                            <button type="button" className="btn-icon" title="Editar" onClick={() => handleEdit(c)}>{'\u270E'}</button>
                            <button type="button" className="btn-icon btn-danger" title="Excluir" onClick={() => handleDelete(c)}>{'\u{1F5D1}'}</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && <p className="empty-row-msg">Nenhum cliente encontrado com esse filtro.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCliente ? (isLumyf ? 'Editar Lead' : 'Editar Cliente') : (isLumyf ? 'Adicionar Lead' : 'Adicionar Cliente')}>
        <form id="form-modal-cliente" onSubmit={handleModalSubmit}>
          <div className="modal-body">
            {isLumyf ? (
              <div className="modal-grid">
                <h4 className="modal-section-title">Informacoes Basicas</h4>
                <div className="form-group"><label htmlFor="modal-nome">Nome *</label><input id="modal-nome" name="nome" type="text" required defaultValue={editingCliente?.nome} /></div>
                <div className="form-group"><label htmlFor="modal-email">Email</label><input id="modal-email" name="email" type="email" defaultValue={editingCliente?.email} /></div>
                <div className="form-group"><label htmlFor="modal-whatsapp">WhatsApp</label><input id="modal-whatsapp" name="whatsapp" type="text" defaultValue={editingCliente?.whatsapp} /></div>
                <div className="form-group"><label htmlFor="modal-telefone">Telefone</label><input id="modal-telefone" name="telefone" type="text" defaultValue={editingCliente?.telefone} /></div>
                <div className="form-group"><label htmlFor="modal-empresa">Empresa</label><input id="modal-empresa" name="empresa" type="text" defaultValue={editingCliente?.empresa} /></div>
                <div className="form-group"><label htmlFor="modal-cargo">Cargo / Profissao</label><input id="modal-cargo" name="cargo" type="text" defaultValue={editingCliente?.cargo} /></div>
                <div className="form-group"><label htmlFor="modal-cidade">Cidade</label><input id="modal-cidade" name="cidade" type="text" defaultValue={editingCliente?.cidade} /></div>
                <div className="form-group"><label htmlFor="modal-pais">Pais</label><input id="modal-pais" name="pais" type="text" defaultValue={editingCliente?.pais} /></div>
                <div className="form-group full"><label htmlFor="modal-comoConheceu">Como conheceu</label><input id="modal-comoConheceu" name="comoConheceu" type="text" defaultValue={editingCliente?.comoConheceu} /></div>

                <h4 className="modal-section-title">Informacoes Comerciais</h4>
                <div className="form-group">
                  <label htmlFor="modal-status">Status</label>
                  <select id="modal-status" name="status" defaultValue={editingCliente?.status || 'novo'}>
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group"><label htmlFor="modal-planoInteresse">Plano de interesse</label><input id="modal-planoInteresse" name="planoInteresse" type="text" defaultValue={editingCliente?.planoInteresse} /></div>
                <div className="form-group"><label htmlFor="modal-valorPotencial">Valor potencial</label><input id="modal-valorPotencial" name="valorPotencial" type="text" defaultValue={editingCliente?.valorPotencial ?? ''} /></div>
                <div className="form-group"><label htmlFor="modal-dataPrimeiroContato">Primeiro contato</label><input id="modal-dataPrimeiroContato" name="dataPrimeiroContato" type="date" defaultValue={normalizeDateValue(editingCliente?.dataPrimeiroContato)} /></div>
                <div className="form-group"><label htmlFor="modal-responsavelAtendimento">Responsavel</label><input id="modal-responsavelAtendimento" name="responsavelAtendimento" type="text" defaultValue={editingCliente?.responsavelAtendimento} /></div>
                <div className="form-group"><label htmlFor="modal-probabilidadeFechamento">Probabilidade (%)</label><input id="modal-probabilidadeFechamento" name="probabilidadeFechamento" type="number" min="0" max="100" defaultValue={editingCliente?.probabilidadeFechamento ?? ''} /></div>

                <h4 className="modal-section-title">Perfil Financeiro</h4>
                <div className="form-group"><label htmlFor="modal-tipoCliente">Tipo de usuario</label><input id="modal-tipoCliente" name="tipoCliente" type="text" defaultValue={editingCliente?.tipoCliente} placeholder="PF, casal, familia, pequena empresa..." /></div>
                <div className="form-group"><label htmlFor="modal-qtdUsuarios">Qtd. de usuarios</label><input id="modal-qtdUsuarios" name="qtdUsuarios" type="number" min="0" defaultValue={editingCliente?.qtdUsuarios ?? ''} /></div>
                <div className="form-group full"><label htmlFor="modal-maiorDificuldadeFinanceira">Maior dificuldade financeira</label><input id="modal-maiorDificuldadeFinanceira" name="maiorDificuldadeFinanceira" type="text" defaultValue={editingCliente?.maiorDificuldadeFinanceira} /></div>
                <div className="form-check"><input id="modal-usaPlanilhaOuApp" name="usaPlanilhaOuApp" type="checkbox" defaultChecked={!!editingCliente?.usaPlanilhaOuApp} /><label htmlFor="modal-usaPlanilhaOuApp">Usa planilha ou outro app</label></div>
                <div className="form-check"><input id="modal-precisaWorkspaceCompartilhado" name="precisaWorkspaceCompartilhado" type="checkbox" defaultChecked={!!editingCliente?.precisaWorkspaceCompartilhado} /><label htmlFor="modal-precisaWorkspaceCompartilhado">Precisa workspace compartilhado</label></div>

                <h4 className="modal-section-title">Historico de Interacoes</h4>
                <div className="form-group"><label htmlFor="modal-ultimoContato">Ultimo contato</label><input id="modal-ultimoContato" name="ultimoContato" type="datetime-local" defaultValue={normalizeDateTimeLocalValue(editingCliente?.ultimoContato)} /></div>
                <div className="form-group"><label htmlFor="modal-proximoFollowUp">Proximo follow-up</label><input id="modal-proximoFollowUp" name="proximoFollowUp" type="datetime-local" defaultValue={normalizeDateTimeLocalValue(editingCliente?.proximoFollowUp)} /></div>
                <div className="form-group"><label htmlFor="modal-canalContato">Canal do contato</label><input id="modal-canalContato" name="canalContato" type="text" defaultValue={editingCliente?.canalContato} placeholder="WhatsApp, Instagram, Email..." /></div>
                <div className="form-group full"><label htmlFor="modal-observacoesConversa">Observacoes da conversa</label><textarea id="modal-observacoesConversa" name="observacoesConversa" rows={3} defaultValue={editingCliente?.observacoesConversa || editingCliente?.observacoes} /></div>

                <h4 className="modal-section-title">Dados do Produto</h4>
                <div className="form-check"><input id="modal-criouConta" name="criouConta" type="checkbox" defaultChecked={!!editingCliente?.criouConta} /><label htmlFor="modal-criouConta">Criou conta</label></div>
                <div className="form-group"><label htmlFor="modal-dataCadastro">Data cadastro</label><input id="modal-dataCadastro" name="dataCadastro" type="date" defaultValue={normalizeDateValue(editingCliente?.dataCadastro)} /></div>
                <div className="form-check"><input id="modal-estaNoTrial" name="estaNoTrial" type="checkbox" defaultChecked={!!editingCliente?.estaNoTrial} /><label htmlFor="modal-estaNoTrial">Esta no trial</label></div>
                <div className="form-group"><label htmlFor="modal-planoAtual">Plano atual</label><input id="modal-planoAtual" name="planoAtual" type="text" defaultValue={editingCliente?.planoAtual} /></div>
                <div className="form-group"><label htmlFor="modal-dataRenovacao">Data renovacao</label><input id="modal-dataRenovacao" name="dataRenovacao" type="date" defaultValue={normalizeDateValue(editingCliente?.dataRenovacao)} /></div>
                <div className="form-check"><input id="modal-cancelou" name="cancelou" type="checkbox" defaultChecked={!!editingCliente?.cancelou} /><label htmlFor="modal-cancelou">Cancelou</label></div>
                <div className="form-group full"><label htmlFor="modal-motivoCancelamento">Motivo do cancelamento</label><textarea id="modal-motivoCancelamento" name="motivoCancelamento" rows={2} defaultValue={editingCliente?.motivoCancelamento} /></div>

                <h4 className="modal-section-title">Marketing</h4>
                <div className="form-group"><label htmlFor="modal-origemLead">Origem do lead</label><input id="modal-origemLead" name="origemLead" type="text" defaultValue={editingCliente?.origemLead} placeholder="Instagram, Indicacao, Google..." /></div>
                <div className="form-group"><label htmlFor="modal-campanha">Campanha</label><input id="modal-campanha" name="campanha" type="text" defaultValue={editingCliente?.campanha} /></div>
                <div className="form-group"><label htmlFor="modal-afiliado">Afiliado</label><input id="modal-afiliado" name="afiliado" type="text" defaultValue={editingCliente?.afiliado} /></div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="modal-nome">Nome *</label>
                  <input id="modal-nome" name="nome" type="text" required placeholder="Nome do cliente" defaultValue={editingCliente?.nome} />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-telefone">Telefone</label>
                  <input id="modal-telefone" name="telefone" type="text" placeholder="(21) 99999-9999" defaultValue={editingCliente?.telefone} />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-endereco">Endereco</label>
                  <input id="modal-endereco" name="endereco" type="text" placeholder="Endereco completo" defaultValue={editingCliente?.endereco} />
                </div>
                <div className="form-check">
                  <input id="modal-temSite" name="temSite" type="checkbox" defaultChecked={editingCliente?.tem_site ?? !!editingCliente?.site} />
                  <label htmlFor="modal-temSite">Possui site?</label>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-site">Site</label>
                  <input id="modal-site" name="site" type="url" placeholder="https://" defaultValue={editingCliente?.site} />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-status">Status</label>
                  <select id="modal-status" name="status" defaultValue={editingCliente?.status || 'novo'}>
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-observacoes">Observacoes</label>
                  <textarea id="modal-observacoes" name="observacoes" rows={3} defaultValue={editingCliente?.observacoes} />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            {editingCliente && (
              <button type="button" className="btn btn-danger" onClick={() => { if (confirm('Excluir este cliente?')) { handleDelete(editingCliente); setModalOpen(false); } }}>
                Excluir
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
