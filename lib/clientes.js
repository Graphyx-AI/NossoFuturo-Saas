import { supabase } from './supabase';

export async function getClientes(nicho) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('nicho', nicho)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    temSite: c.tem_site ?? !!(c.site || '').trim()
  }));
}

export async function getAllClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    temSite: c.tem_site ?? !!(c.site || '').trim()
  }));
}

export async function createCliente(nicho, cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nicho,
      nome: (cliente.nome || '').trim(),
      telefone: (cliente.telefone || '').trim(),
      endereco: (cliente.endereco || '').trim(),
      site: (cliente.site || '').trim(),
      tem_site: !!cliente.temSite,
      status: cliente.status || 'novo',
      observacoes: (cliente.observacoes || '').trim()
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, temSite: data.tem_site };
}

export async function updateCliente(id, campos) {
  const updateData = {};
  const allowed = ['nome', 'telefone', 'endereco', 'site', 'temSite', 'status', 'observacoes'];
  for (const k of allowed) {
    if (campos[k] !== undefined) {
      updateData[k === 'temSite' ? 'tem_site' : k] = campos[k];
    }
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, temSite: data.tem_site };
}

export async function deleteCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  return !error;
}
