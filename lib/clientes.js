import { supabase } from './supabase';

const TABLE = 'clients';

function toUiClient(row) {
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
    temSite: row.has_website
  };
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
    status: cliente.status || 'novo',
    notes: (cliente.observacoes || '').trim(),
    raw_csv_path: cliente.raw_csv_path || null
  };
}

export async function getClientes(nicho) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('niche', nicho)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toUiClient);
}

export async function getAllClientes() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toUiClient);
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
  if (campos.status !== undefined) payload.status = campos.status;
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
