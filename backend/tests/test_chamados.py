"""Chamados endpoint: listing, filtering, pagination, sorting, detail, export."""


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_list_requires_auth(client):
    assert client.get("/chamados").status_code == 401


def test_list_returns_paginated(client, operador_token):
    resp = client.get("/chamados", headers=auth(operador_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    assert body["pages"] == 1


def test_filter_by_secretaria(client, operador_token):
    resp = client.get("/chamados?secretaria=SMTR", headers=auth(operador_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert all(i["secretaria"] == "SMTR" for i in body["items"])


def test_filter_by_situacao(client, operador_token):
    resp = client.get("/chamados?situacao=encerrado", headers=auth(operador_token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_filter_by_ano_mes(client, operador_token):
    resp = client.get("/chamados?ano_mes=2024-01", headers=auth(operador_token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_search_q(client, operador_token):
    resp = client.get("/chamados?q=buraco", headers=auth(operador_token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert "buraco" in resp.json()["items"][0]["subtipo"]


def test_search_by_id(client, operador_token):
    resp = client.get("/chamados?q=1001", headers=auth(operador_token))
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_pagination(client, operador_token):
    resp = client.get("/chamados?page=1&page_size=2", headers=auth(operador_token))
    body = resp.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["pages"] == 2

    resp2 = client.get("/chamados?page=2&page_size=2", headers=auth(operador_token))
    assert len(resp2.json()["items"]) == 1


def test_detail_found(client, operador_token):
    resp = client.get("/chamados/1001", headers=auth(operador_token))
    assert resp.status_code == 200
    assert resp.json()["id_chamado"] == "1001"


def test_detail_not_found(client, operador_token):
    assert client.get("/chamados/9999", headers=auth(operador_token)).status_code == 404


def test_export_csv(client, operador_token):
    resp = client.get("/chamados/export", headers=auth(operador_token))
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    lines = resp.text.strip().split("\n")
    assert len(lines) == 4  # header + 3 rows


def test_export_filtered_csv(client, operador_token):
    resp = client.get("/chamados/export?secretaria=SEOP", headers=auth(operador_token))
    lines = resp.text.strip().split("\n")
    assert len(lines) == 2  # header + 1 row
