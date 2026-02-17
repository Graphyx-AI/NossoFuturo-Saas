import { supabase } from './supabase';

const NEW_TABLE = 'clients';
const LEGACY_TABLE = 'clientes';

function normalizeFromNew(row) {
  return {
    id: row.id,
    nicho: row.niche,
    nome: row.name,
    telefone: row.phone || '',
    endereco: row.address || '',
    site: row.website || '',
    tem_site: row.has_website,
    status: row.status || 'novo',
    observacoes: row.notes || '',
    raw_csv_path: row.raw_csv_path || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    temSite: row.has_website,
    _table: NEW_TABLE
  };
}

function normalizeFromLegacy(row) {
  return {
    ...row,
    nome: row.nome || '',
    telefone: row.telefone || '',
    endereco: row.endereco || '',
    site: row.site || '',
    tem_site: row.tem_site ?? !!(row.site || '').trim(),
    status: row.status || 'novo',
    observacoes: row.observacoes || '',
    raw_csv_path: row.raw_csv_path || null,
    temSite: row.tem_site ?? !!(row.site || '').trim(),
    _table: LEGACY_TABLE
  };
}

function toNewPayload(nicho, cliente) {
  const website = (cliente.site || '').trim();
  return {
    niche: nicho,
    name: (cliente.nome || '').trim(),
    phone: (cliente.telefone || '').trim(),
    address: (cliente.endereco || '').trim(),
    website,
    has_website: cliente.temSite ?? !!website,
    status: cliente.status || 'novo',
    notes: (cliente.observacoes || '').trim(),
    raw_csv_path: cliente.raw_csv_path || null
  };
}

function toLegacyPayload(nicho, cliente) {
  const site = (cliente.site || '').trim();
  return {
    nicho,
    nome: (cliente.nome || '').trim(),
    telefone: (cliente.telefone || '').trim(),
    endereco: (cliente.endereco || '').trim(),
    site,
    tem_site: cliente.temSite ?? !!site,
    status: cliente.status || 'novo',
    observacoes: (cliente.observacoes || '').trim()
  };
}

function dedupeById(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export async function getClientes(nicho) {
  const [newRes, legacyRes] = await Promise.all([
    supabase.from(NEW_TABLE).select('*').eq('niche', nicho).order('created_at', { ascending: false }),
    supabase.from(LEGACY_TABLE).select('*').eq('nicho', nicho).order('created_at', { ascending: false })
  ]);

  if (newRes.error && legacyRes.error) throw newRes.error;

  const fromNew = (newRes.data || []).map(normalizeFromNew);
  const fromLegacy = (legacyRes.data || []).map(normalizeFromLegacy);

  return dedupeById([...fromNew, ...fromLegacy]).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

export async function getAllClientes() {
  const [newRes, legacyRes] = await Promise.all([
    supabase.from(NEW_TABLE).select('*').order('created_at', { ascending: false }),
    supabase.from(LEGACY_TABLE).select('*').order('created_at', { ascending: false })
  ]);

  if (newRes.error && legacyRes.error) throw newRes.error;

  const fromNew = (newRes.data || []).map(normalizeFromNew);
  const fromLegacy = (legacyRes.data || []).map(normalizeFromLegacy);

  return dedupeById([...fromNew, ...fromLegacy]).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

export async function createCliente(nicho, cliente) {
  const payload = toNewPayload(nicho, cliente);
  const { data, error } = await supabase.from(NEW_TABLE).insert(payload).select().single();

  if (!error && data) return normalizeFromNew(data);

  const legacy = await supabase.from(LEGACY_TABLE).insert(toLegacyPayload(nicho, cliente)).select().single();
  if (legacy.error) throw error || legacy.error;
  return normalizeFromLegacy(legacy.data);
}

export async function updateCliente(id, campos) {
  const cliente = {
    nome: campos.nome,
    telefone: campos.telefone,
    endereco: campos.endereco,
    site: campos.site,
    temSite: campos.temSite,
    status: campos.status,
    observacoes: campos.observacoes,
    raw_csv_path: campos.raw_csv_path
  };

  const newPayload = {};
  if (cliente.nome !== undefined) newPayload.name = (cliente.nome || '').trim();
  if (cliente.telefone !== undefined) newPayload.phone = (cliente.telefone || '').trim();
  if (cliente.endereco !== undefined) newPayload.address = (cliente.endereco || '').trim();
  if (cliente.site !== undefined) newPayload.website = (cliente.site || '').trim();
  if (cliente.temSite !== undefined) newPayload.has_website = !!cliente.temSite;
  if (cliente.status !== undefined) newPayload.status = cliente.status;
  if (cliente.observacoes !== undefined) newPayload.notes = (cliente.observacoes || '').trim();
  if (cliente.raw_csv_path !== undefined) newPayload.raw_csv_path = cliente.raw_csv_path || null;

  const newTry = await supabase.from(NEW_TABLE).update(newPayload).eq('id', id).select().maybeSingle();
  if (!newTry.error && newTry.data) return normalizeFromNew(newTry.data);

  const legacyPayload = {};
  if (cliente.nome !== undefined) legacyPayload.nome = (cliente.nome || '').trim();
  if (cliente.telefone !== undefined) legacyPayload.telefone = (cliente.telefone || '').trim();
  if (cliente.endereco !== undefined) legacyPayload.endereco = (cliente.endereco || '').trim();
  if (cliente.site !== undefined) legacyPayload.site = (cliente.site || '').trim();
  if (cliente.temSite !== undefined) legacyPayload.tem_site = !!cliente.temSite;
  if (cliente.status !== undefined) legacyPayload.status = cliente.status;
  if (cliente.observacoes !== undefined) legacyPayload.observacoes = (cliente.observacoes || '').trim();

  const legacyTry = await supabase.from(LEGACY_TABLE).update(legacyPayload).eq('id', id).select().single();
  if (legacyTry.error) throw newTry.error || legacyTry.error;
  return normalizeFromLegacy(legacyTry.data);
}

export async function deleteCliente(id) {
  const [delNew, delLegacy] = await Promise.all([
    supabase.from(NEW_TABLE).delete().eq('id', id),
    supabase.from(LEGACY_TABLE).delete().eq('id', id)
  ]);

  if (delNew.error && delLegacy.error) throw delNew.error;
  return true;
}
