
import requests
import csv
import time
import uuid
import os

# ==============================================================================
# 🔐 SUA API KEY
# ==============================================================================

API_KEY = "79bf493ec7d24e82b433885bfe39cb98"

# ==============================================================================
# 📍 REGIÃO (Rio de Janeiro - ajuste se quiser)
# ==============================================================================

REGIAO = "rect:-43.45,-23.10,-43.10,-22.90"
LIMITE_POR_NICHO = 80
OUTPUT_DIR = "dados"

# ==============================================================================
# 🎯 SEUS NICHOS (CATEGORIAS COMPATÍVEIS)
# ==============================================================================

NICHOS = {
    "dentista": {
        "categorias": "healthcare.dentist",
        "excluir": []
    },
    "clinica_estetica": {
        "categorias": "service.beauty.spa,service.beauty",
        "excluir": ["drogaria", "farmácia", "pharmacy", "chemist"]
    },
    "psicologo": {
        "categorias": "healthcare.clinic_or_praxis.psychiatry",
        "excluir": []
    },
    "barbearia": {
        "categorias": "service.beauty.hairdresser",
        "excluir": ["salão", "cabeleireiro"],
        "incluir_obrigatorio": ["barbearia", "barber"]
    },
    "imobiliaria": {
        "categorias": "office.estate_agent",
        "excluir": []
    },
    "empresa_limpeza": {
        "categorias": "service.cleaning",
        "excluir": []
    },
    "turismo_excursao": {
        "categorias": "office.travel_agent",
        "excluir": []
    }
}

# ==============================================================================
# 🔎 FILTRO DE NOME
# ==============================================================================

def passa_filtro(nome, config):
    nome_lower = nome.lower()

    # Excluir palavras proibidas
    for palavra in config.get("excluir", []):
        if palavra.lower() in nome_lower:
            return False

    # Palavras obrigatórias
    obrigatorias = config.get("incluir_obrigatorio")
    if obrigatorias:
        if not any(p.lower() in nome_lower for p in obrigatorias):
            return False

    return True


# ==============================================================================
# 🔎 BUSCA COM RETRY E PROTEÇÃO
# ==============================================================================

def buscar_nicho(config, limite):
    url = "https://api.geoapify.com/v2/places"

    resultados = []
    ids_vistos = set()
    offset = 0

    while len(resultados) < limite:
        params = {
            "categories": config["categorias"],
            "filter": REGIAO,
            "limit": 100,
            "offset": offset,
            "apiKey": API_KEY
        }

        tentativa = 0
        while tentativa < 3:
            try:
                r = requests.get(url, params=params, timeout=20)
                print("Status:", r.status_code)

                if r.status_code != 200:
                    print("Erro:", r.text)
                    return resultados

                data = r.json()
                break

            except requests.exceptions.RequestException:
                tentativa += 1
                print(f"⚠️ Erro de conexão. Tentando novamente ({tentativa}/3)...")
                time.sleep(3)

        else:
            print("❌ Falha após 3 tentativas.")
            return resultados

        features = data.get("features", [])

        if not features:
            break

        for place in features:
            props = place.get("properties", {})
            place_id = props.get("place_id")

            if not place_id or place_id in ids_vistos:
                continue

            nome = props.get("name")
            if not nome:
                continue

            if not passa_filtro(nome, config):
                continue

            telefone = (props.get("contact") or {}).get("phone", "")
            site = props.get("website", "")
            bairro = props.get("suburb", "")

            resultados.append({
                "id": f"geo-{uuid.uuid4().hex[:8]}",
                "nome": nome,
                "bairro": bairro,
                "endereco": props.get("formatted", ""),
                "telefone": telefone,
                "site": site,
            })

            ids_vistos.add(place_id)

            if len(resultados) >= limite:
                break

        offset += 100
        time.sleep(1)  # 🔥 delay maior para evitar rate limit

    return resultados


# ==============================================================================
# 💾 SALVAR CSV
# ==============================================================================

def salvar_csv(caminho, dados):
    fieldnames = ["id", "nome", "bairro", "endereco", "telefone", "site"]

    with open(caminho, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dados)


# ==============================================================================
# 🚀 EXECUÇÃO PRINCIPAL
# ==============================================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for nome_nicho, config in NICHOS.items():
        print(f"\n🔎 Buscando: {nome_nicho}")

        leads = buscar_nicho(config, LIMITE_POR_NICHO)

        caminho = os.path.join(OUTPUT_DIR, f"{nome_nicho}.csv")
        salvar_csv(caminho, leads)

        print(f"✅ {len(leads)} leads salvos.")

    print("\n🎉 Processo finalizado.")


if __name__ == "__main__":
    main()
