import { supabase } from './supabase';

const CANONICAL_TABLE = 'clients';
const LEGACY_TABLE = 'clientes';

function normalizeStatus(status) {
  const allowed = new Set(['novo', 'contatado', 'interessado', 'negociacao', 'fechado', 'recusado']);
  return allowed.has(status) ? status : 'novo';
}

function toUiClient(row) {
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
    if (existing?.source === 'local_csv' && c?.source === 'supabase') {
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

function toDbPayload(nicho, cliente) {
  const website = (cliente.site || '').trim();
  return {
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

async function fetchCanonical(nicho) {
  let q = supabase.from(CANONICAL_TABLE).select('*').order('created_at', { ascending: false });
  if (nicho) q = q.eq('niche', nicho);
  return q;
}

async function fetchLegacy(nicho) {
  let q = supabase.from(LEGACY_TABLE).select('*').order('created_at', { ascending: false });
  if (nicho) q = q.eq('nicho', nicho);
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

export async function getClientes(nicho) {
  const [supabaseRes, localClientes] = await Promise.all([
    supabase
      .from(TABLE)
      .select('*')
      .eq('niche', nicho)
      .order('created_at', { ascending: false }),
    getLocalClientes(nicho)
  ]);

  if (supabaseRes.error) {
    if (localClientes.length > 0) return localClientes;
    throw supabaseRes.error;
  }

  const supabaseClientes = (supabaseRes.data || []).map(toUiClient);
  return dedupeClientes([...supabaseClientes, ...localClientes]);
}

export async function getAllClientes() {
  const [supabaseRes, localClientes] = await Promise.all([
    supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false }),
    getLocalClientes()
  ]);

  if (supabaseRes.error) {
    if (localClientes.length > 0) return localClientes;
    throw supabaseRes.error;
  }

  const supabaseClientes = (supabaseRes.data || []).map(toUiClient);
  return dedupeClientes([...supabaseClientes, ...localClientes]);
}

export async function createCliente(nicho, cliente) {
  const canonical = await tryInsert(CANONICAL_TABLE, toCanonicalPayload(nicho, cliente), toUiClientFromCanonical);
  if (!canonical.error) return canonical.data;

  const legacy = await tryInsert(LEGACY_TABLE, toLegacyPayload(nicho, cliente), toUiClientFromLegacy);
  if (!legacy.error) return legacy.data;

  if (!isMissingTableError(canonical.error)) throw canonical.error;
  throw legacy.error;
}

export async function updateCliente(id, campos) {
  const payload = {};
  if (campos.nome !== undefined) payload.name = (campos.nome || '').trim();
  if (campos.telefone !== undefined) payload.phone = (campos.telefone || '').trim();
  if (campos.endereco !== undefined) payload.address = (campos.endereco || '').trim();
  if (campos.site !== undefined) payload.website = (campos.site || '').trim();
  if (campos.temSite !== undefined) payload.has_website = !!campos.temSite;
  if (campos.status !== undefined) payload.status = normalizeStatus(campos.status);
  if (campos.observacoes !== undefined) payload.notes = (campos.observacoes || '').trim();

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
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
