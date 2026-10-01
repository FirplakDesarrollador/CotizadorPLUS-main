"""Extract seven DB production examples for the spatial interpretation (read only).

Run with the bundled Python. No workbook is modified. Every panel retains its
Excel row, letter, cutting dimensions and manufacturer formula.
"""
import collections
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ("DB15-1S", "DB15-1S MBLE", 3, 1, False),
    ("DB30-2S", "DB30-2S MBLE", 3, 2, False),
    ("DB24-2", "HRJ DB24-2 MBLE", 2, 0, False),
    ("DB30-3", "DB30-3 MBLE", 3, 0, False),
    ("DB24-4", "DB24-4 MBLE", 4, 0, False),
    ("DB30-2S SM", "HRJ DB30-2S SM-15MM MBLE", 3, 2, True),
    ("DB22-2+INT SMG", "HRJ DB22-2+INT SMG Expocamacol", 2, 0, True),
]


def main():
    workbook = openpyxl.load_workbook(ROOT / "Hojas de ruta 2.xlsx", read_only=True, data_only=True)
    rows = workbook.active.values
    header = next(rows)
    groups = collections.defaultdict(list)
    for number, values in enumerate(rows, 2):
        row = dict(zip(header, values))
        sku = str(row["DESCRIPCION SKU"] or "")
        if re.match(r"^(HRJ )?DB[0-9]", sku, re.I):
            groups[sku].append(dict(
                row=number, letter=row["LETRA"], name=str(row["PIEZA"]).strip(),
                l=float(row["LARGO"]), a=float(row["ANCHO"]), t=float(row["Espesor"]),
                formula=row["Formula"] or "", quantity=row["CANTIDAD"],
            ))
    examples = []
    for label, prefix, count, small, gola in TARGETS:
        matches = [(sku, panels) for sku, panels in groups.items() if sku.startswith(prefix)]
        assert len(matches) == 1, (prefix, len(matches))
        sku, panels = matches[0]
        panels = sorted(panels, key=lambda panel: panel["letter"])
        side = next(p for p in panels if p["name"].startswith("SIDE R"))
        base = next(p for p in panels if p["name"] == "BASE")
        fronts = [p for p in panels if p["name"].startswith("FRENTE") and " INT" not in p["name"]]
        assert len(fronts) == count
        assert all(p["quantity"] is None for p in panels)
        width, height, depth = base["l"] + 2 * side["t"], side["l"], side["a"]
        closure = sum(p["l"] for p in fronts) + count * 3.2 + (53.6 if gola else 0) - height
        examples.append(dict(label=label, sku=sku, nc=count, small=small, gola=gola,
                             hidden="+INT" in label, W=width, H=height, D=depth,
                             closure=round(closure, 4), panels=panels))
    output = ROOT / "artifacts" / "interpretacion-db"
    output.mkdir(parents=True, exist_ok=True)
    payload = dict(source="Hojas de ruta 2.xlsx", sheet="Hoja1", date="2026-09-10",
                   dbRows=sum(map(len, groups.values())), dbSheets=len(groups), examples=examples)
    (output / "evidencia-db.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    workbook.close()
    print(json.dumps({"rows": payload["dbRows"], "sheets": payload["dbSheets"],
                      "examples": [{"sku": e["label"], "panels": len(e["panels"]), "closure_mm": e["closure"]}
                                   for e in examples]}, ensure_ascii=True))


if __name__ == "__main__":
    main()
