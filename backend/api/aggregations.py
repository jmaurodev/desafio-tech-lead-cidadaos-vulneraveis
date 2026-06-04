"""
Rollup do dashboard a partir do mart de grão fino (mês × secretaria).

O trabalho pesado de agregação (varrer ~5M chamados, classificar, contar) é
feito no dbt, materializado em mart_..._kpi_mensal_secretaria (~centenas de
linhas com medidas ADITIVAS). Aqui a API só faz um rollup trivial dessa tabela
para a janela de meses escolhida no slider — sem I/O de banco e sem varrer o
fato por request.

Por que rollup na API e não um mart por janela (Opção B): ver docs/decisoes.md.
Em resumo, somar centenas de linhas pré-agregadas não é a agregação que o
princípio "não agregar na API" visa evitar (varredura do fato), e escala melhor
caso o grão fique mais fino no futuro.

Métricas não-aditivas são derivadas dos componentes: tempo médio =
soma_duracao_encerrados / total_encerrados; taxa = total_no_prazo /
total_encerrados.
"""
import polars as pl

_SUM_COLS = [
    "total_chamados",
    "total_encerrados",
    "total_no_prazo",
    "total_fora_prazo",
    "total_em_andamento",
    "soma_duracao_encerrados",
]


def _derive(df: pl.DataFrame) -> pl.DataFrame:
    """Deriva tempo médio e taxa a partir dos componentes aditivos somados."""
    return df.with_columns(
        pl.when(pl.col("total_encerrados") > 0)
        .then(
            # cast p/ float: soma vem como Decimal(38,0) do DuckDB e Decimal/Int
            # truncaria (escala 0) em vez de dar a média real
            (pl.col("soma_duracao_encerrados").cast(pl.Float64) / pl.col("total_encerrados")).round(1)
        )
        .otherwise(None)
        .alias("tempo_medio_resolucao_dias"),
        pl.when(pl.col("total_encerrados") > 0)
        .then((100.0 * pl.col("total_no_prazo") / pl.col("total_encerrados")).round(1))
        .otherwise(None)
        .alias("taxa_resolucao_prazo"),
    ).drop("soma_duracao_encerrados")


def _rollup(df: pl.DataFrame, group: list[str] | None) -> pl.DataFrame:
    sums = [pl.col(c).sum().alias(c) for c in _SUM_COLS]
    out = df.group_by(group).agg(sums) if group else df.select(sums)
    return _derive(out)


_EMPTY_KPI = {
    "total_chamados": 0,
    "total_encerrados": 0,
    "total_no_prazo": 0,
    "total_fora_prazo": 0,
    "total_em_andamento": 0,
    "tempo_medio_resolucao_dias": None,
    "taxa_resolucao_prazo": None,
    "data_mais_antiga": None,
    "data_mais_recente": None,
}


def compute_dashboard(
    df: pl.DataFrame,
    mes_inicio: str | None = None,
    mes_fim: str | None = None,
) -> dict:
    """Rollup do mart de grão fino para a janela [mes_inicio, mes_fim].

    mes_min/mes_max refletem o intervalo total disponível (independente do
    filtro), para alimentar o domínio do slider no front.
    """
    meses = df.get_column("ano_mes").drop_nulls()
    mes_min = meses.min() if meses.len() else None
    mes_max = meses.max() if meses.len() else None

    if mes_inicio:
        df = df.filter(pl.col("ano_mes") >= mes_inicio)
    if mes_fim:
        df = df.filter(pl.col("ano_mes") <= mes_fim)

    if df.height:
        kpi = _rollup(df, None).to_dicts()[0]
        kpi["data_mais_antiga"] = str(df.get_column("data_mais_antiga").min())
        kpi["data_mais_recente"] = str(df.get_column("data_mais_recente").max())
    else:
        kpi = dict(_EMPTY_KPI)

    por_mes = _rollup(df, ["ano_mes"]).sort("ano_mes").to_dicts()
    por_secretaria = (
        _rollup(df, ["secretaria"]).sort("total_chamados", descending=True).to_dicts()
    )

    return {
        "kpi": kpi,
        "por_mes": por_mes,
        "por_secretaria": por_secretaria,
        "mes_min": mes_min,
        "mes_max": mes_max,
    }
