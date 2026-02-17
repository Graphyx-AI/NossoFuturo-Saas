import csv
import re

clinicas = []
with open("clinicas_barra_tijuca.csv", "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    for row in r:
        if row.get("nome", "").strip():
            clinicas.append(row)

def escape_js(s):
    if s is None:
        return '""'
    s = str(s).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r")
    return f'"{s}"'

lines = []
for c in clinicas:
    linha = f'      {{ nome: {escape_js(c["nome"])}, endereco: {escape_js(c["endereco"])}, telefone: {escape_js(c["telefone"])}, site: {escape_js(c["site"])} }}'
    lines.append(linha)
js_array = ",\n".join(lines)

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

pattern = r'const CLINICAS = \[[\s\S]*?\];'
replacement = f"const CLINICAS = [\n{js_array}\n    ];"
new_html = re.sub(pattern, replacement, html)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(new_html)

print(f"index.html atualizado com {len(clinicas)} clínicas do CSV.")
