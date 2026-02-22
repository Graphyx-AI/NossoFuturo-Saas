import { getSupabaseConfigErrorMessage, isSupabaseConfigured, supabase } from './supabase';
import { DEFAULT_WORKSPACE_ID } from './workspaces';
import { isE2EMockModeEnabled } from './mock-mode';

const CANONICAL_TABLE = 'clients';
const LEGACY_TABLE = 'clientes';
const MOCK_STORAGE_KEY = 'crm:e2e:clientes:v1';

const DEFAULT_MOCK_CLIENTES = {
  graphyx: [
    {
      id: 'g-1',
      workspace: 'graphyx',
      nicho: 'psicologo',
      nome: 'Lead Inicial Graphyx',
      telefone: '(21) 99999-1111',
      endereco: 'Rua Um, 100',
      site: '',
      tem_site: false,
      status: 'novo',
      observacoes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'mock',
      temSite: false
    }
  ],
  lumyf: [
    {
      id: 'l-1',
      workspace: 'lumyf',
      nicho: 'instagram',
      nome: 'Lead Inicial Lumyf',
      telefone: '',
      endereco: '',
      site: '',
      tem_site: false,
      status: 'contatado',
      email: 'lead@lumyf.local',
      whatsapp: '(11) 98888-1111',
      planoInteresse: 'Plano Pro',
      responsavelAtendimento: 'Equipe Lumyf',
      observacoesConversa: 'Primeiro contato realizado.',
      observacoes: 'Primeiro contato realizado.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'mock',
      temSite: false
    }
  ]
};

let mockStore = null;

function normalizeStatus(status) {
  const allowed = new Set([
    'novo',
    'contatado',
    'interessado',
    'negociacao',
    'fechado',
    'recusado',
    'testando',
    'cliente',
    'perdido'
  ]);
  return allowed.has(status) ? status : 'novo';
}

function normalizeWorkspace(workspaceId) {
  const value = String(workspaceId || DEFAULT_WORKSPACE_ID).trim().toLowerCase();
  return value || DEFAULT_WORKSPACE_ID;
}


function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadMockStore() {
  if (mockStore) return mockStore;

  mockStore = deepCopy(DEFAULT_MOCK_CLIENTES);

  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(MOCK_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          mockStore = {
            ...deepCopy(DEFAULT_MOCK_CLIENTES),
            ...parsed
          };
        }
      } catch {
        mockStore = deepCopy(DEFAULT_MOCK_CLIENTES);
      }
    }
  }

  return mockStore;
}

function saveMockStore() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockStore));
}

function getMockWorkspaceList(workspaceId) {
  const store = loadMockStore();
  const ws = normalizeWorkspace(workspaceId);
  if (!store[ws]) store[ws] = [];
  return store[ws];
}

function applyMockCreate(nicho, cliente, workspaceId) {
  const workspace = normalizeWorkspace(workspaceId);
  const now = new Date().toISOString();
  const item = {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspace,
    nicho,
    nome: (cliente.nome || '').trim(),
    telefone: (cliente.telefone || '').trim(),
    endereco: (cliente.endereco || '').trim(),
    site: (cliente.site || '').trim(),
    tem_site: cliente.temSite ?? !!(cliente.site || '').trim(),
    status: normalizeStatus(cliente.status || 'novo'),
    observacoes: (cliente.observacoes || '').trim(),
    email: (cliente.email || '').trim(),
    whatsapp: (cliente.whatsapp || '').trim(),
    empresa: (cliente.empresa || '').trim(),
    cargo: (cliente.cargo || '').trim(),
    cidade: (cliente.cidade || '').trim(),
    pais: (cliente.pais || '').trim(),
    comoConheceu: (cliente.comoConheceu || '').trim(),
    planoInteresse: (cliente.planoInteresse || '').trim(),
    valorPotencial: cliente.valorPotencial ?? null,
    dataPrimeiroContato: cliente.dataPrimeiroContato || '',
    responsavelAtendimento: (cliente.responsavelAtendimento || '').trim(),
    probabilidadeFechamento: cliente.probabilidadeFechamento ?? null,
    tipoCliente: (cliente.tipoCliente || '').trim(),
    maiorDificuldadeFinanceira: (cliente.maiorDificuldadeFinanceira || '').trim(),
    usaPlanilhaOuApp: cliente.usaPlanilhaOuApp ?? null,
    qtdUsuarios: cliente.qtdUsuarios ?? null,
    precisaWorkspaceCompartilhado: cliente.precisaWorkspaceCompartilhado ?? null,
    ultimoContato: cliente.ultimoContato || '',
    proximoFollowUp: cliente.proximoFollowUp || '',
    canalContato: (cliente.canalContato || '').trim(),
    observacoesConversa: (cliente.observacoesConversa || '').trim(),
    criouConta: cliente.criouConta ?? null,
    dataCadastro: cliente.dataCadastro || '',
    estaNoTrial: cliente.estaNoTrial ?? null,
    planoAtual: (cliente.planoAtual || '').trim(),
    dataRenovacao: cliente.dataRenovacao || '',
    cancelou: cliente.cancelou ?? null,
    motivoCancelamento: (cliente.motivoCancelamento || '').trim(),
    origemLead: (cliente.origemLead || '').trim(),
    campanha: (cliente.campanha || '').trim(),
    afiliado: (cliente.afiliado || '').trim(),
    created_at: now,
    updated_at: now,
    source: 'mock',
    temSite: cliente.temSite ?? !!(cliente.site || '').trim()
  };

  const list = getMockWorkspaceList(workspaceId);
  list.unshift(item);
  saveMockStore();
  return item;
}

function applyMockUpdate(id, campos) {
  const store = loadMockStore();
  for (const workspaceId of Object.keys(store)) {
    const idx = (store[workspaceId] || []).findIndex(c => c.id === id);
    if (idx < 0) continue;

    const current = store[workspaceId][idx];
    const next = {
      ...current,
      ...campos,
      status: campos.status !== undefined ? normalizeStatus(campos.status) : current.status,
      tem_site: campos.temSite !== undefined ? !!campos.temSite : (campos.tem_site !== undefined ? !!campos.tem_site : current.tem_site),
      temSite: campos.temSite !== undefined ? !!campos.temSite : (campos.tem_site !== undefined ? !!campos.tem_site : current.temSite),
      site: campos.site !== undefined ? String(campos.site || '').trim() : current.site,
      updated_at: new Date().toISOString()
    };

    store[workspaceId][idx] = next;
    saveMockStore();
    return next;
  }

  throw new Error('Cliente nao encontrado.');
}

function applyMockDelete(id) {
  const store = loadMockStore();
  for (const workspaceId of Object.keys(store)) {
    const before = store[workspaceId].length;
    store[workspaceId] = store[workspaceId].filter(c => c.id !== id);
    if (store[workspaceId].length !== before) {
      saveMockStore();
      return true;
    }
  }
  return true;
}

function readMockClientes(nicho, workspaceId) {
  const list = getMockWorkspaceList(workspaceId);
  const filtered = nicho ? list.filter(c => c.nicho === nicho) : list;
  return deepCopy(filtered).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
function isMissingTableError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42P01' || (message.includes('relation') && message.includes('not exist'));
}

function isMissingWorkspaceColumnError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42703' || (message.includes('column') && message.includes('workspace'));
}

function toUiClientFromCanonical(row) {
  return {
    id: row.id,
    workspace: row.workspace || DEFAULT_WORKSPACE_ID,
    nicho: row.niche,
    nome: row.name,
    telefone: row.phone || '',
    endereco: row.address || '',
    site: row.website || '',
    tem_site: !!row.has_website,
    status: normalizeStatus(row.status),
    observacoes: row.notes || '',
    email: row.email || '',
    whatsapp: row.whatsapp || '',
    empresa: row.company || '',
    cargo: row.job_title || '',
    cidade: row.city || '',
    pais: row.country || '',
    comoConheceu: row.how_heard_about_us || '',
    planoInteresse: row.plan_interest || '',
    valorPotencial: row.potential_value,
    dataPrimeiroContato: row.first_contact_date || '',
    responsavelAtendimento: row.owner_name || '',
    probabilidadeFechamento: row.close_probability,
    tipoCliente: row.user_type || '',
    maiorDificuldadeFinanceira: row.main_financial_pain || '',
    usaPlanilhaOuApp: row.uses_spreadsheet_or_app,
    qtdUsuarios: row.user_count,
    precisaWorkspaceCompartilhado: row.needs_shared_workspace,
    ultimoContato: row.last_contact_at || '',
    proximoFollowUp: row.next_followup_at || '',
    canalContato: row.contact_channel || '',
    observacoesConversa: row.conversation_notes || '',
    criouConta: row.created_account,
    dataCadastro: row.signup_date || '',
    estaNoTrial: row.is_trial,
    planoAtual: row.current_plan || '',
    dataRenovacao: row.renewal_date || '',
    cancelou: row.is_canceled,
    motivoCancelamento: row.cancel_reason || '',
    origemLead: row.lead_source || '',
    campanha: row.campaign || '',
    afiliado: row.affiliate || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: 'supabase',
    temSite: !!row.has_website
  };
}

function toUiClientFromLegacy(row) {
  return {
    id: row.id,
    workspace: row.workspace || DEFAULT_WORKSPACE_ID,
    nicho: row.nicho,
    nome: row.nome,
    telefone: row.telefone || '',
    endereco: row.endereco || '',
    site: row.site || '',
    tem_site: !!row.tem_site,
    status: normalizeStatus(row.status),
    observacoes: row.observacoes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: 'supabase',
    temSite: !!row.tem_site
  };
}

function dedupeClientes(clientes) {
  const byKey = new Map();

  for (const c of clientes) {
    const key = [
      (c.workspace || DEFAULT_WORKSPACE_ID).trim().toLowerCase(),
      (c.nicho || '').trim().toLowerCase(),
      (c.nome || '').trim().toLowerCase(),
      (c.telefone || '').replace(/\D/g, ''),
      (c.endereco || '').trim().toLowerCase()
    ].join('|');

    if (!byKey.has(key)) {
      byKey.set(key, c);
      continue;
    }

    if (!byKey.has(key)) {
      byKey.set(key, c);
    }
  }

  return Array.from(byKey.values());
}

function toCanonicalPayload(nicho, cliente, workspaceId) {
  const website = (cliente.site || '').trim();
  return {
    workspace: normalizeWorkspace(workspaceId),
    niche: nicho,
    name: (cliente.nome || '').trim(),
    phone: (cliente.telefone || '').trim(),
    address: (cliente.endereco || '').trim(),
    website,
    has_website: cliente.temSite ?? !!website,
    status: normalizeStatus(cliente.status || 'novo'),
    notes: (cliente.observacoes || '').trim(),
    email: (cliente.email || '').trim(),
    whatsapp: (cliente.whatsapp || '').trim(),
    company: (cliente.empresa || '').trim(),
    job_title: (cliente.cargo || '').trim(),
    city: (cliente.cidade || '').trim(),
    country: (cliente.pais || '').trim(),
    how_heard_about_us: (cliente.comoConheceu || '').trim(),
    plan_interest: (cliente.planoInteresse || '').trim(),
    potential_value: cliente.valorPotencial ?? null,
    first_contact_date: cliente.dataPrimeiroContato || null,
    owner_name: (cliente.responsavelAtendimento || '').trim(),
    close_probability: cliente.probabilidadeFechamento ?? null,
    user_type: (cliente.tipoCliente || '').trim(),
    main_financial_pain: (cliente.maiorDificuldadeFinanceira || '').trim(),
    uses_spreadsheet_or_app: cliente.usaPlanilhaOuApp ?? null,
    user_count: cliente.qtdUsuarios ?? null,
    needs_shared_workspace: cliente.precisaWorkspaceCompartilhado ?? null,
    last_contact_at: cliente.ultimoContato || null,
    next_followup_at: cliente.proximoFollowUp || null,
    contact_channel: (cliente.canalContato || '').trim(),
    conversation_notes: (cliente.observacoesConversa || '').trim(),
    created_account: cliente.criouConta ?? null,
    signup_date: cliente.dataCadastro || null,
    is_trial: cliente.estaNoTrial ?? null,
    current_plan: (cliente.planoAtual || '').trim(),
    renewal_date: cliente.dataRenovacao || null,
    is_canceled: cliente.cancelou ?? null,
    cancel_reason: (cliente.motivoCancelamento || '').trim(),
    lead_source: (cliente.origemLead || '').trim(),
    campaign: (cliente.campanha || '').trim(),
    affiliate: (cliente.afiliado || '').trim()
  };
}

function toLegacyPayload(nicho, cliente, workspaceId) {
  const website = (cliente.site || '').trim();
  return {
    workspace: normalizeWorkspace(workspaceId),
    nicho,
    nome: (cliente.nome || '').trim(),
    telefone: (cliente.telefone || '').trim(),
    endereco: (cliente.endereco || '').trim(),
    site: website,
    tem_site: cliente.temSite ?? !!website,
    status: normalizeStatus(cliente.status || 'novo'),
    observacoes: (cliente.observacoes || '').trim()
  };
}

async function fetchCanonical(nicho, workspaceId) {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  let q = supabase
    .from(CANONICAL_TABLE)
    .select('*')
    .eq('workspace', normalizeWorkspace(workspaceId))
    .order('created_at', { ascending: false });

  if (nicho) q = q.eq('niche', nicho);
  return q;
}

async function fetchLegacy(nicho, workspaceId) {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  const normalizedWorkspace = normalizeWorkspace(workspaceId);

  let q = supabase
    .from(LEGACY_TABLE)
    .select('*')
    .eq('workspace', normalizedWorkspace)
    .order('created_at', { ascending: false });

  if (nicho) q = q.eq('nicho', nicho);

  const withWorkspaceFilter = await q;
  if (!isMissingWorkspaceColumnError(withWorkspaceFilter.error)) {
    return withWorkspaceFilter;
  }

  if (normalizedWorkspace !== DEFAULT_WORKSPACE_ID) {
    return { data: [], error: null };
  }

  let fallback = supabase.from(LEGACY_TABLE).select('*').order('created_at', { ascending: false });
  if (nicho) fallback = fallback.eq('nicho', nicho);
  return fallback;
}

async function readSupabaseClientes(nicho, workspaceId) {
  const [canonicalRes, legacyRes] = await Promise.all([
    fetchCanonical(nicho, workspaceId),
    fetchLegacy(nicho, workspaceId)
  ]);

  const canonicalMissing = canonicalRes.error && isMissingTableError(canonicalRes.error);
  const legacyMissing = legacyRes.error && isMissingTableError(legacyRes.error);

  if (canonicalRes.error && !canonicalMissing && legacyRes.error && !legacyMissing) {
    throw canonicalRes.error;
  }

  const canonicalRows = canonicalRes.error ? [] : (canonicalRes.data || []).map(toUiClientFromCanonical);
  const legacyRows = legacyRes.error ? [] : (legacyRes.data || []).map(toUiClientFromLegacy);

  return dedupeClientes([...canonicalRows, ...legacyRows]);
}

async function tryInsert(table, payload, mapper) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) return { data: null, error };
  return { data: mapper(data), error: null };
}

export async function getClientes(nicho, workspaceId = DEFAULT_WORKSPACE_ID) {
  if (isE2EMockModeEnabled()) return readMockClientes(nicho, workspaceId);
  return readSupabaseClientes(nicho, workspaceId);
}

export async function getAllClientes(workspaceId = DEFAULT_WORKSPACE_ID) {
  if (isE2EMockModeEnabled()) return readMockClientes(undefined, workspaceId);
  return readSupabaseClientes(undefined, workspaceId);
}

export async function createCliente(nicho, cliente, workspaceId = DEFAULT_WORKSPACE_ID) {
  if (isE2EMockModeEnabled()) return applyMockCreate(nicho, cliente, workspaceId);

  if (!isSupabaseConfigured) {
    throw new Error(getSupabaseConfigErrorMessage());
  }

  const canonical = await tryInsert(
    CANONICAL_TABLE,
    toCanonicalPayload(nicho, cliente, workspaceId),
    toUiClientFromCanonical
  );
  if (!canonical.error) return canonical.data;

  const legacy = await tryInsert(
    LEGACY_TABLE,
    toLegacyPayload(nicho, cliente, workspaceId),
    toUiClientFromLegacy
  );
  if (!legacy.error) return legacy.data;

  if (!isMissingTableError(canonical.error)) throw canonical.error;
  throw legacy.error;
}

export async function updateCliente(id, campos) {
  if (isE2EMockModeEnabled()) return applyMockUpdate(id, campos);

  if (!isSupabaseConfigured) {
    throw new Error(getSupabaseConfigErrorMessage());
  }

  const canonicalPayload = {};
  if (campos.nome !== undefined) canonicalPayload.name = (campos.nome || '').trim();
  if (campos.telefone !== undefined) canonicalPayload.phone = (campos.telefone || '').trim();
  if (campos.endereco !== undefined) canonicalPayload.address = (campos.endereco || '').trim();
  if (campos.site !== undefined) canonicalPayload.website = (campos.site || '').trim();
  if (campos.temSite !== undefined) canonicalPayload.has_website = !!campos.temSite;
  if (campos.status !== undefined) canonicalPayload.status = normalizeStatus(campos.status);
  if (campos.observacoes !== undefined) canonicalPayload.notes = (campos.observacoes || '').trim();
  if (campos.email !== undefined) canonicalPayload.email = (campos.email || '').trim();
  if (campos.whatsapp !== undefined) canonicalPayload.whatsapp = (campos.whatsapp || '').trim();
  if (campos.empresa !== undefined) canonicalPayload.company = (campos.empresa || '').trim();
  if (campos.cargo !== undefined) canonicalPayload.job_title = (campos.cargo || '').trim();
  if (campos.cidade !== undefined) canonicalPayload.city = (campos.cidade || '').trim();
  if (campos.pais !== undefined) canonicalPayload.country = (campos.pais || '').trim();
  if (campos.comoConheceu !== undefined) canonicalPayload.how_heard_about_us = (campos.comoConheceu || '').trim();
  if (campos.planoInteresse !== undefined) canonicalPayload.plan_interest = (campos.planoInteresse || '').trim();
  if (campos.valorPotencial !== undefined) canonicalPayload.potential_value = campos.valorPotencial ?? null;
  if (campos.dataPrimeiroContato !== undefined) canonicalPayload.first_contact_date = campos.dataPrimeiroContato || null;
  if (campos.responsavelAtendimento !== undefined) canonicalPayload.owner_name = (campos.responsavelAtendimento || '').trim();
  if (campos.probabilidadeFechamento !== undefined) canonicalPayload.close_probability = campos.probabilidadeFechamento ?? null;
  if (campos.tipoCliente !== undefined) canonicalPayload.user_type = (campos.tipoCliente || '').trim();
  if (campos.maiorDificuldadeFinanceira !== undefined) canonicalPayload.main_financial_pain = (campos.maiorDificuldadeFinanceira || '').trim();
  if (campos.usaPlanilhaOuApp !== undefined) canonicalPayload.uses_spreadsheet_or_app = campos.usaPlanilhaOuApp ?? null;
  if (campos.qtdUsuarios !== undefined) canonicalPayload.user_count = campos.qtdUsuarios ?? null;
  if (campos.precisaWorkspaceCompartilhado !== undefined) canonicalPayload.needs_shared_workspace = campos.precisaWorkspaceCompartilhado ?? null;
  if (campos.ultimoContato !== undefined) canonicalPayload.last_contact_at = campos.ultimoContato || null;
  if (campos.proximoFollowUp !== undefined) canonicalPayload.next_followup_at = campos.proximoFollowUp || null;
  if (campos.canalContato !== undefined) canonicalPayload.contact_channel = (campos.canalContato || '').trim();
  if (campos.observacoesConversa !== undefined) canonicalPayload.conversation_notes = (campos.observacoesConversa || '').trim();
  if (campos.criouConta !== undefined) canonicalPayload.created_account = campos.criouConta ?? null;
  if (campos.dataCadastro !== undefined) canonicalPayload.signup_date = campos.dataCadastro || null;
  if (campos.estaNoTrial !== undefined) canonicalPayload.is_trial = campos.estaNoTrial ?? null;
  if (campos.planoAtual !== undefined) canonicalPayload.current_plan = (campos.planoAtual || '').trim();
  if (campos.dataRenovacao !== undefined) canonicalPayload.renewal_date = campos.dataRenovacao || null;
  if (campos.cancelou !== undefined) canonicalPayload.is_canceled = campos.cancelou ?? null;
  if (campos.motivoCancelamento !== undefined) canonicalPayload.cancel_reason = (campos.motivoCancelamento || '').trim();
  if (campos.origemLead !== undefined) canonicalPayload.lead_source = (campos.origemLead || '').trim();
  if (campos.campanha !== undefined) canonicalPayload.campaign = (campos.campanha || '').trim();
  if (campos.afiliado !== undefined) canonicalPayload.affiliate = (campos.afiliado || '').trim();

  const { data: canonicalData, error: canonicalError } = await supabase
    .from(CANONICAL_TABLE)
    .update(canonicalPayload)
    .eq('id', id)
    .select()
    .single();

  if (!canonicalError) return toUiClientFromCanonical(canonicalData);
  if (!isMissingTableError(canonicalError)) throw canonicalError;

  const legacyPayload = {};
  if (campos.nome !== undefined) legacyPayload.nome = (campos.nome || '').trim();
  if (campos.telefone !== undefined) legacyPayload.telefone = (campos.telefone || '').trim();
  if (campos.endereco !== undefined) legacyPayload.endereco = (campos.endereco || '').trim();
  if (campos.site !== undefined) legacyPayload.site = (campos.site || '').trim();
  if (campos.temSite !== undefined) legacyPayload.tem_site = !!campos.temSite;
  if (campos.status !== undefined) legacyPayload.status = normalizeStatus(campos.status);
  if (campos.observacoes !== undefined) legacyPayload.observacoes = (campos.observacoes || '').trim();

  const { data: legacyData, error: legacyError } = await supabase
    .from(LEGACY_TABLE)
    .update(legacyPayload)
    .eq('id', id)
    .select()
    .single();

  if (legacyError) throw legacyError;
  return toUiClientFromLegacy(legacyData);
}

export async function deleteCliente(id) {
  if (isE2EMockModeEnabled()) return applyMockDelete(id);

  if (!isSupabaseConfigured) {
    throw new Error(getSupabaseConfigErrorMessage());
  }

  const canonicalRes = await supabase.from(CANONICAL_TABLE).delete().eq('id', id);
  if (canonicalRes.error && !isMissingTableError(canonicalRes.error)) {
    throw canonicalRes.error;
  }

  const legacyRes = await supabase.from(LEGACY_TABLE).delete().eq('id', id);
  if (legacyRes.error && !isMissingTableError(legacyRes.error)) {
    throw legacyRes.error;
  }

  if (canonicalRes.error && legacyRes.error) {
    throw canonicalRes.error;
  }

  return true;
}




