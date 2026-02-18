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

    return NextResponse.json({ data: clients });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erro ao ler CSV local.' }, { status: 500 });
  }
}
