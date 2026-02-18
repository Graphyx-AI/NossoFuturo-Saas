import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const CSV_TO_NICHE = {
  'psicologo.csv': 'psicologo',
  'imobiliaria.csv': 'imobiliaria',
  'curso_online.csv': 'curso_online',
  'dentista.csv': 'dentista',
  'clinica_estetica.csv': 'clinica_estetica',
  'clinicas_barra_tijuca.csv': 'clinica_estetica',
  'barbearia.csv': 'barbearia',
  'empresa_limpeza.csv': 'empresa_limpeza',
  'coach.csv': 'coach',
  'turismo_excursao.csv': 'turismo_excursao'
};


const JSON_TO_NICHE = {
  psicologo: 'psicologo',
  imobiliaria: 'imobiliaria',
  curso_online: 'curso_online',
  dentista: 'dentista',
  clinica_estetica: 'clinica_estetica',
  barbearia: 'barbearia',
  empresa_limpeza: 'empresa_limpeza',
  coach: 'coach',
  turismo_excursao: 'turismo_excursao',
  mvp: 'mvp'
};

async function readJsonFallback(nicheFilter) {
  const jsonPath = path.join(process.cwd(), 'dados_atualizados.json');
  const content = await fs.readFile(jsonPath, 'utf8').catch(() => '');
  if (!content) return [];

  const payload = JSON.parse(content);
  if (!payload || typeof payload !== 'object') return [];

  const clients = [];

  Object.entries(payload).forEach(([key, rows]) => {
    const mappedNiche = JSON_TO_NICHE[key] || key;
    if (nicheFilter && mappedNiche !== nicheFilter) return;
    if (!Array.isArray(rows)) return;

    rows.forEach((row, index) => {
      const mapped = mapRowToUi(row || {}, mappedNiche, `dados_atualizados.json:${key}`, index);
      if (mapped) {
        mapped.status = safeTrim(row?.status) || 'novo';
        mapped.observacoes = safeTrim(row?.observacoes);
        clients.push(mapped);
      }
    });
  });

  return clients;
}

function parseCsv(content) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(current);
      const hasData = row.some(cell => String(cell || '').trim() !== '');
      if (hasData) rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    const hasData = row.some(cell => String(cell || '').trim() !== '');
    if (hasData) rows.push(row);
  }

  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;
  return dataRows.map(cols => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[String(key || '').trim()] = (cols[idx] || '').trim();
    });
    return obj;
  });
}

function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapRowToUi(row, niche, sourceFile, index) {
  const nome = (row.nome || '').trim();
  if (!nome) return null;

  const site = (row.site || '').trim();
  const temSiteFlag = String(row.tem_site || '').toLowerCase();
  const temSite = ['sim', '1', 'true', 'yes', 's'].includes(temSiteFlag) || !!site;

  return {
    id: `local-${niche}-${sourceFile}-${index}`,
    nicho: niche,
    nome,
    telefone: (row.telefone || '').trim(),
    endereco: (row.endereco || '').trim(),
    site,
    tem_site: temSite,
    status: 'novo',
    observacoes: '',
    raw_csv_path: sourceFile,
    source: 'local_csv',
    temSite
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nicheFilter = searchParams.get('nicho');
    const dadosDir = path.join(process.cwd(), 'dados');

    const entries = await fs.readdir(dadosDir).catch(() => []);
    const csvFiles = entries.filter(name => name.toLowerCase().endsWith('.csv'));

    const clients = [];

    for (const fileName of csvFiles) {
      const mappedNiche = CSV_TO_NICHE[fileName];
      if (!mappedNiche) continue;
      if (nicheFilter && mappedNiche !== nicheFilter) continue;

      const absPath = path.join(dadosDir, fileName);
      const content = await fs.readFile(absPath, 'utf8');
      const rows = parseCsv(content);
      rows.forEach((row, index) => {
        const mapped = mapRowToUi(row, mappedNiche, fileName, index);
        if (mapped) clients.push(mapped);
      });
    }

    if (clients.length > 0) {
      return NextResponse.json({ data: clients });
    }

    const fallbackClients = await readJsonFallback(nicheFilter);
    return NextResponse.json({ data: fallbackClients });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erro ao ler CSV local.' }, { status: 500 });
  }
}
