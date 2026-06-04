"""Dashboard endpoint: structure and data integrity."""


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_dashboard_requires_auth(client):
    assert client.get("/dashboard").status_code == 401


def test_dashboard_structure(client, operador_token):
    resp = client.get("/dashboard", headers=auth(operador_token))
    assert resp.status_code == 200
    body = resp.json()

    assert "kpi" in body
    assert "por_mes" in body
    assert "por_secretaria" in body


def test_dashboard_kpi_values(client, operador_token):
    kpi = client.get("/dashboard", headers=auth(operador_token)).json()["kpi"]
    assert kpi["total_chamados"] == 3
    assert kpi["total_encerrados"] == 2
    assert kpi["total_no_prazo"] == 2
    assert abs(kpi["taxa_resolucao_prazo"] - 100.0) < 0.01


def test_dashboard_por_mes_count(client, operador_token):
    por_mes = client.get("/dashboard", headers=auth(operador_token)).json()["por_mes"]
    assert len(por_mes) == 3
    assert por_mes[0]["ano_mes"] == "2024-01"


def test_dashboard_por_secretaria(client, operador_token):
    por_sec = client.get("/dashboard", headers=auth(operador_token)).json()["por_secretaria"]
    secretarias = {s["secretaria"] for s in por_sec}
    assert "SMTR" in secretarias
    assert "SEOP" in secretarias


def test_dashboard_expoe_dominio_de_meses(client, operador_token):
    body = client.get("/dashboard", headers=auth(operador_token)).json()
    assert body["mes_min"] == "2024-01"
    assert body["mes_max"] == "2024-03"


def test_dashboard_filtro_por_mes_recorta_dados(client, operador_token):
    resp = client.get(
        "/dashboard?mes_inicio=2024-01&mes_fim=2024-01", headers=auth(operador_token)
    )
    body = resp.json()
    # Só o chamado de janeiro entra
    assert body["kpi"]["total_chamados"] == 1
    assert body["kpi"]["total_encerrados"] == 1
    assert len(body["por_mes"]) == 1
    assert body["por_mes"][0]["ano_mes"] == "2024-01"
    # mes_min/mes_max refletem o domínio completo, não o filtro
    assert body["mes_min"] == "2024-01"
    assert body["mes_max"] == "2024-03"
    # secretaria só SMTR no recorte de janeiro
    secretarias = {s["secretaria"] for s in body["por_secretaria"]}
    assert secretarias == {"SMTR"}
