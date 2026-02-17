#!/usr/bin/env python3
"""Import processed CSV files into Supabase `public.clients`.

Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python scripts/import_csv_to_supabase.py
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from supabase import Client, create_client

CSV_TO_NICHE = {
    "psicologo.csv": "psicologo",
    "imobiliaria.csv": "imobiliaria",
    "curso_online.csv": "curso_online",
    "dentista.csv": "dentista",
    "clinica_estetica.csv": "clinica_estetica",
    "barbearia.csv": "barbearia",
    "empresa_limpeza.csv": "empresa_limpeza",
    "coach.csv": "coach",
    "turismo_excursao.csv": "turismo_excursao",
}


@dataclass
class ProcessedClient:
    name: str
    niche: str
    raw_csv_path: str
    phone: str
    address: str
    website: str

    def to_record(self) -> dict:
        return {
            "name": self.name,
            "niche": self.niche,
            "raw_csv_path": self.raw_csv_path,
            "phone": self.phone,
            "address": self.address,
            "website": self.website,
            "has_website": bool(self.website),
        }


def load_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars")
    return create_client(url, key)


def parse_csv(csv_path: Path, niche: str) -> Iterable[ProcessedClient]:
    with csv_path.open("r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            name = (row.get("nome") or "").strip()
            if not name:
                continue

            yield ProcessedClient(
                name=name,
                niche=niche,
                raw_csv_path=str(csv_path),
                phone=(row.get("telefone") or "").strip(),
                address=(row.get("endereco") or "").strip(),
                website=(row.get("site") or "").strip(),
            )


def upsert_batch(supabase: Client, records: list[dict]) -> None:
    if not records:
        return

    # unique key is composable and avoids duplicate imports for same source row
    response = (
        supabase.table("clients")
        .upsert(records, on_conflict="niche,name,raw_csv_path")
        .execute()
    )
    if getattr(response, "error", None):
        raise RuntimeError(str(response.error))


def main() -> None:
    supabase = load_supabase_client()
    data_dir = Path(__file__).resolve().parents[1] / "dados"

    total = 0
    for file_name, niche in CSV_TO_NICHE.items():
        csv_path = data_dir / file_name
        if not csv_path.exists():
            continue

        batch = [client.to_record() for client in parse_csv(csv_path, niche)]
        upsert_batch(supabase, batch)
        total += len(batch)
        print(f"Imported {len(batch)} rows from {csv_path.name} to niche={niche}")

    print(f"Done. Imported/updated {total} records in Supabase.")


if __name__ == "__main__":
    main()
