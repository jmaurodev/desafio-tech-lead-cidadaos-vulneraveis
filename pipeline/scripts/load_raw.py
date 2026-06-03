import duckdb
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data"
DB_PATH = DATA_DIR / "cidadaos_vulneraveis.duckdb"

TABLES = {
    "raw_chamados":              "chamado.csv",
    "raw_bairro":                "bairro.csv",
    "raw_area_planejamento":     "area_planejamento.csv",
    "raw_regiao_administrativa": "regiao_administrativa.csv",
    "raw_subprefeitura":         "subprefeitura.csv",
}

con = duckdb.connect(str(DB_PATH))

for table, filename in TABLES.items():
    path = DATA_DIR / filename
    if not path.exists():
        print(f"  AVISO: {filename} não encontrado em {DATA_DIR}, pulando.")
        continue
    print(f"Carregando {filename} → {table}...")
    con.execute(f"""
        create or replace table {table} as
        select * from read_csv_auto('{path}', header=true)
    """)
    n = con.execute(f"select count(*) from {table}").fetchone()[0]
    print(f"  {n:,} linhas carregadas.")

con.close()
print("\nCarga concluída.")
