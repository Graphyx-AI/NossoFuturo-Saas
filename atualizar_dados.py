#!/usr/bin/env python3
"""
Gera js/dados-iniciais.js a partir dos CSVs de cada nicho.
Mapeamento: arquivo.csv -> chave no DADOS_PYTHON
"""

import csv
import os
import re
import uuid

# Mapeamento: arquivo CSV -> chave em NICHOS
CSV_TO_NICHO = {
    "psicologo.csv": "psicologo",
    "imobiliaria.csv": "imobiliaria",
    "curso_online.csv": "curso_online",
    "dentista.csv": "dentista",
    "clinica_estetica.csv": "clinica_estetica",
    "clinicas_barra_tijuca.csv": "clinica_estetica",
    "barbearia.csv": "barbearia",
    "empresa_limpeza.csv": "empresa_limpeza",
    "coach.csv": "coach",
    "turismo_excursao.csv": "turismo_excursao",
}

# Nichos na ordem do config.js
NICHOS_ORDER = [
    "psicologo",
    "imobiliaria",
    "curso_online",
    "dentista",
    "clinica_estetica",
    "barbearia",
    "empresa_limpeza",
    "coach",
    "turismo_excursao",
]


def escape_js(s):
    if s is None:
        return '""'
    s = str(s).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r")
    return f'"{s}"'


def row_to_cliente(row):
    """Converte linha do CSV para objeto cliente."""
    nome = (row.get("nome") or "").strip()
    if not nome:
        return None

    endereco = (row.get("endereco") or "").strip()
    telefone = (row.get("telefone") or "").strip()
    site = (row.get("site") or "").strip()
    tem_site_val = (row.get("tem_site") or "").lower() in ("sim", "1", "true", "yes", "s")
    tem_site = tem_site_val or bool(site)

    return {
        "id": f"py-{uuid.uuid4().hex[:12]}",
        "nome": nome,
        "telefone": telefone,
        "endereco": endereco,
        "site": site,
        "temSite": tem_site,
        "status": "novo",
        "observacoes": "",
    }


def cliente_to_js(c):
    """Serializa cliente para linha JavaScript."""
    return (
        f"      {{ id: {escape_js(c['id'])}, nome: {escape_js(c['nome'])}, "
        f"telefone: {escape_js(c['telefone'])}, endereco: {escape_js(c['endereco'])}, "
        f"site: {escape_js(c['site'])}, temSite: {'true' if c['temSite'] else 'false'}, "
        f"status: {escape_js(c['status'])}, observacoes: {escape_js(c['observacoes'])} }}"
    )


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dados_dir = os.path.join(script_dir, "dados")
    dados = {nicho: [] for nicho in NICHOS_ORDER}

    if not os.path.isdir(dados_dir):
        print(f"⚠️  A pasta 'dados' não foi encontrada em: {dados_dir}")
        print("   Certifique-se de rodar o 'buscar_clinicas.py' antes.")
        return

    print(f"📂 Lendo arquivos CSV de: {dados_dir}")

    for csv_file, nicho in CSV_TO_NICHO.items():
        path = os.path.join(dados_dir, csv_file)
        if not os.path.isfile(path):
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c = row_to_cliente(row)
                    if c:
                        dados[nicho].append(c)
            print(f"  {csv_file} -> {nicho}: {len(dados[nicho])} clientes")
        except Exception as e:
            print(f"  Erro em {csv_file}: {e}")

    out_path = os.path.join(script_dir, "js", "dados-iniciais.js")
    lines = [
        "/**",
        " * Dados iniciais - gerado pelo script atualizar_dados.py",
        " * Nichos sem CSV ficam como array vazio.",
        " */",
        "const DADOS_PYTHON = {",
    ]

    for nicho in NICHOS_ORDER:
        arr = dados[nicho]
        if not arr:
            lines.append(f"  {nicho}: [],")
        else:
            client_js = ",\n".join(cliente_to_js(c) for c in arr)
            lines.append(f"  {nicho}: [")
            lines.append(client_js)
            lines.append("  ],")

    lines.append("};")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    total = sum(len(v) for v in dados.values())
    print(f"\njs/dados-iniciais.js atualizado com {total} clientes no total.")


if __name__ == "__main__":
    main()
