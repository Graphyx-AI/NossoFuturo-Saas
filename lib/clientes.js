import { getSupabaseConfigErrorMessage, isSupabaseConfigured, supabase } from './supabase';

const CANONICAL_TABLE = 'clients';
const LEGACY_TABLE = 'clientes';
const LOCAL_STORAGE_KEY = 'prospeccao-local-clientes';

function isLocalOnlyId(id) {
  return String(id).startsWith('local-only-');
}

function getLocalOnlyClientes(nicho) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(arr) ? arr : [];
    return nicho ? list.filter(c => (c.nicho || '') === nicho) : list;
  } catch {
    return [];
  }
}

function setLocalOnlyClientes(clientes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clientes));
  } catch {}
}

function normalizeStatus(status) {
  const allowed = new Set(['novo', 'contatado', 'interessado', 'negociacao', 'fechado', 'recusado']);
  return allowed.has(status) ? status : 'novo';
}

function isMissingTableError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42P01' || message.includes('does not exist') || message.includes('relation') && message.includes('not exist');
}

function toUiClientFromCanonical(row) {
  return {
    id: row.id,
    nicho: row.niche,
    nome: row.name,
    telefone: row.phone || '',
    endereco: row.address || '',
    site: row.website || '',
    tem_site: !!row.has_website,
    status: normalizeStatus(row.status),
    observacoes: row.notes || '',
    raw_csv_path: row.raw_csv_path || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: 'supabase',
    temSite: !!row.has_website
  };
}

function toUiClientFromLegacy(row) {
  return {
    id: row.id,
    nicho: row.nicho,
    nome: row.nome,
    telefone: row.telefone || '',
    endereco: row.endereco || '',
    site: row.site || '',
    tem_site: !!row.tem_site,
    status: normalizeStatus(row.status),
    observacoes: row.observacoes || '',
    raw_csv_path: row.raw_csv_path || null,
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
      (c.nicho || '').trim().toLowerCase(),
      (c.nome || '').trim().toLowerCase(),
      (c.telefone || '').replace(/\D/g, ''),
      (c.endereco || '').trim().toLowerCase()
    ].join('|');

    if (!byKey.has(key)) {
      byKey.set(key, c);
      continue;
    }

    const existing = byKey.get(key);
    if (existing?.source === 'local_csv' && (c?.source === 'supabase' || c?.source === 'local_only')) {
      byKey.set(key, c);
    }
  }

  return Array.from(byKey.values());
}

async function getLocalClientes(nicho) {
  try {
    const qs = nicho ? `?nicho=${encodeURIComponent(nicho)}` : '';
    const resp = await fetch(`/api/clientes-local${qs}`, { cache: 'no-store' });
    if (!resp.ok) return [];

    const payload = await resp.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
}

function toCanonicalPayload(nicho, cliente) {
  const website = (cliente.site || '').trim();
  return {
    tenant_id: getActiveTenantId(),
    niche: nicho,
    name: (cliente.nome || '').trim(),
    phone: (cliente.telefone || '').trim(),
    address: (cliente.endereco || '').trim(),
    website,
    has_website: cliente.temSite ?? !!website,
    status: normalizeStatus(cliente.status || 'novo'),
    notes: (cliente.observacoes || '').trim(),
    raw_csv_path: cliente.raw_csv_path || null
  };
}

function toLegacyPayload(nicho, cliente) {
  const website = (cliente.site || '').trim();
  return {
    tenant_id: getActiveTenantId(),
    nicho,
    nome: (cliente.nome || '').trim(),
    telefone: (cliente.telefone || '').trim(),
    endereco: (cliente.endereco || '').trim(),
    site: website,
    tem_site: cliente.temSite ?? !!website,
    status: normalizeStatus(cliente.status || 'novo'),
    observacoes: (cliente.observacoes || '').trim(),
    raw_csv_path: cliente.raw_csv_path || null
  };
}

function getActiveTenantId() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('active-tenant-id');
    return raw || null;
  } catch {
    return null;
  }
}

function fetchCanonical(nicho) {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }
  let q = supabase.from(CANONICAL_TABLE).select('*').order('created_at', { ascending: false });
  if (nicho) q = q.eq('niche', nicho);
  const tenantId = getActiveTenantId();
  if (tenantId) q = q.eq('tenant_id', tenantId);
  return q;
}

async function fetchLegacy(nicho) {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }
  let q = supabase.from(LEGACY_TABLE).select('*').order('created_at', { ascending: false });
  if (nicho) q = q.eq('nicho', nicho);
  const tenantId = getActiveTenantId();
  if (tenantId) q = q.eq('tenant_id', tenantId);
  return q;
}

async function readSupabaseClientes(nicho) {
  const [canonicalRes, legacyRes] = await Promise.all([fetchCanonical(nicho), fetchLegacy(nicho)]);

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

export async function getClientes(nicho) {
  const [supabaseClientes, localClientes] = await Promise.allSettled([
    readSupabaseClientes(nicho),
    getLocalClientes(nicho)
  ]);

  const local = localClientes.status === 'fulfilled' ? localClientes.value : [];

  if (supabaseClientes.status === 'rejected') {
    if (local.length > 0) return dedupeClientes([...local, ...getLocalOnlyClientes(nicho)]);
    return dedupeClientes(getLocalOnlyClientes(nicho));
  }

  return dedupeClientes([...(supabaseClientes.value || []), ...local, ...getLocalOnlyClientes(nicho)]);
}

export async function getAllClientes() {
  const [supabaseClientes, localClientes] = await Promise.allSettled([
    readSupabaseClientes(),
    getLocalClientes()
  ]);

  const local = localClientes.status === 'fulfilled' ? localClientes.value : [];

  if (supabaseClientes.status === 'rejected') {
    if (local.length > 0) return dedupeClientes([...local, ...getLocalOnlyClientes()]);
    return dedupeClientes(getLocalOnlyClientes());
  }

  return dedupeClientes([...(supabaseClientes.value || []), ...local, ...getLocalOnlyClientes()]);
}

export async function createCliente(nicho, cliente) {
  if (!isSupabaseConfigured) {
    const id = `local-only-${nicho}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const website = (cliente.site || '').trim();
    const temSite = cliente.temSite ?? !!website;
    const novo = {
      id,
      nicho,
      nome: (cliente.nome || '').trim(),
      telefone: (cliente.telefone || '').trim(),
      endereco: (cliente.endereco || '').trim(),
      site: website,
      tem_site: temSite,
      status: normalizeStatus(cliente.status || 'novo'),
      observacoes: (cliente.observacoes || '').trim(),
      source: 'local_only',
      temSite
    };
    const todos = getLocalOnlyClientes();
    todos.push(novo);
    setLocalOnlyClientes(todos);
    return novo;
  }

  const canonical = await tryInsert(CANONICAL_TABLE, toCanonicalPayload(nicho, cliente), toUiClientFromCanonical);
  if (!canonical.error) return canonical.data;

  const legacy = await tryInsert(LEGACY_TABLE, toLegacyPayload(nicho, cliente), toUiClientFromLegacy);
  if (!legacy.error) return legacy.data;

  if (!isMissingTableError(canonical.error)) throw canonical.error;
  throw legacy.error;
}

export async function updateCliente(id, campos) {
  if (isLocalOnlyId(id)) {
    const todos = getLocalOnlyClientes();
    const idx = todos.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Cliente local não encontrado.');
    const c = todos[idx];
    if (campos.nome !== undefined) c.nome = (campos.nome || '').trim();
    if (campos.telefone !== undefined) c.telefone = (campos.telefone || '').trim();
    if (campos.endereco !== undefined) c.endereco = (campos.endereco || '').trim();
    if (campos.site !== undefined) c.site = (campos.site || '').trim();
    if (campos.temSite !== undefined) {
      c.tem_site = !!campos.temSite;
      c.temSite = !!campos.temSite;
    }
    if (campos.status !== undefined) c.status = normalizeStatus(campos.status);
    if (campos.observacoes !== undefined) c.observacoes = (campos.observacoes || '').trim();
    todos[idx] = c;
    setLocalOnlyClientes(todos);
    return c;
  }
  if (String(id).startsWith('local-')) {
    throw new Error('Cliente local (CSV) é somente leitura.');
  }

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
  if (isLocalOnlyId(id)) {
    const todos = getLocalOnlyClientes();
    const filtered = todos.filter(c => c.id !== id);
    if (filtered.length === todos.length) throw new Error('Cliente local não encontrado.');
    setLocalOnlyClientes(filtered);
    return true;
  }
  if (String(id).startsWith('local-')) {
    throw new Error('Cliente local (CSV) é somente leitura.');
  }

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
