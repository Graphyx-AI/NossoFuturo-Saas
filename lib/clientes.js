import { supabase, isSupabaseConfigured } from './supabase';

const TABLE = 'clients';

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
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toDbPayload(nicho, cliente))
    .select()
    .single();

  if (error) throw error;
  return toUiClient(data);
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

  if (error) throw error;
  return toUiClient(data);
}

export async function deleteCliente(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}
