import random
import shutil
import uuid
from datetime import datetime, timedelta
import csv

# Data de referência: "hoje" - liquidação prevista é SEMPRE da data atual pra frente
# Para usar data real ao rodar: HOJE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
HOJE = datetime(2026, 2, 23)

NOMES_ESTABELECIMENTOS = {
    1: "Loja Centro - Matriz",
    2: "Loja Norte",
    3: "Loja Sul",
    4: "Loja Shopping",
    5: "Filial Oeste",
    6: "Academia Fitness Pro Norte",
    7: "Farmácia Saúde Total - Loja 1",
    8: "Loja de Eletrônicos MAX",
    9: "Supermercado Bom Preço Centro",
    10: "Posto de Combustível Rodovia",
}

CREDENCIADORAS = ["Cielo", "Dock", "PagSeguro", "Stone", "Rede"]
BANDEIRAS = ["Visa", "Mastercard", "Elo", "Hipercard"]


def gerar_cnpj():
    return str(random.randint(10000000000000, 99999999999999))


def gerar_nome(i):
    return NOMES_ESTABELECIMENTOS.get(i, f"Estabelecimento {i}")


def gerar_evento(tipo, valor_ur, data_base):
    evento = {}
    evento["data_evento"] = data_base.strftime("%Y-%m-%d")
    evento["tipo_evento"] = tipo
    evento["valor_esperado"] = valor_ur
    evento["valor_liquidado"] = 0
    evento["valor_chargeback"] = 0

    if tipo == "LIQUIDACAO_TOTAL":
        evento["valor_liquidado"] = valor_ur

    elif tipo == "LIQUIDACAO_PARCIAL":
        evento["valor_liquidado"] = round(valor_ur * random.uniform(0.3, 0.8), 2)

    elif tipo == "CHARGEBACK_PRE_LIQUIDACAO":
        evento["valor_chargeback"] = round(valor_ur * random.uniform(0.08, 0.15), 2)

    elif tipo == "CHARGEBACK_POS_LIQUIDACAO":
        evento["valor_liquidado"] = valor_ur
        evento["valor_chargeback"] = round(valor_ur * random.uniform(0.08, 0.15), 2)

    elif tipo == "NAO_LIQUIDADA":
        evento["valor_liquidado"] = 0

    elif tipo == "UR_PREVISTA":
        # ~15% das URs previstas têm chargeback (liquidacao_prevista_com_chargeback)
        if random.random() < 0.15:
            evento["valor_chargeback"] = round(valor_ur * random.uniform(0.05, 0.15), 2)

    return evento


linhas = []
contratos = []  # Dados explícitos de contrato (valor total = meta)
ur_seq = 0

# 50% dos contratos terão problemas (chargeback, nao_liquidada, parcial)
# Nos contratos com problema, ~10% do valor total será problema
contratos_com_problema = set(random.sample(range(1, 11), 5))  # 5 de 10

for i in range(1, 11):
    cnpj = gerar_cnpj()
    nome = gerar_nome(i)
    contrato_id = str(uuid.uuid4())
    client_id = str(uuid.uuid4())
    contrato_numero = f"CTR-2025-{str(i).zfill(3)}"
    merchant_id = f"MERCH{i:03d}"
    tem_problema = i in contratos_com_problema

    # Contrato: data_inicio no passado, data_fim SEMPRE no futuro (após HOJE)
    data_inicio = HOJE - timedelta(days=random.randint(60, 120))
    duracao_dias = random.randint(180, 365)  # mínimo 6 meses para data_fim ficar no futuro
    data_fim = data_inicio + timedelta(days=duracao_dias)
    if data_fim <= HOJE:
        data_fim = HOJE + timedelta(days=random.randint(60, 365))

    # Acumula valor total do contrato (meta) - soma das URs
    valor_total_contrato = 0.0

    for j in range(100):
        ur_seq += 1
        ur_id = f"UR-{ur_seq:06d}"
        # valor_ur para total do contrato ficar entre 50k e 300k (100 URs)
        valor_ur = round(random.uniform(500, 3000), 2)
        # UR entre data_inicio e data_fim
        # Para UR_PREVISTA: data_liq_esperada DEVE ser DEPOIS de HOJE
        if random.random() < 0.35:
            # 35% URs com liquidação prevista - data SEMPRE de HOJE pra frente (>= HOJE)
            dias_ate_fim = max(0, (data_fim - HOJE).days)
            dias_no_futuro = random.randint(0, min(dias_ate_fim, 120))
            data_liq_esperada = HOJE + timedelta(days=dias_no_futuro)
            tipo = "UR_PREVISTA"
        else:
            # 65% URs no passado
            dias_apos_inicio = random.randint(0, min(max(0, (HOJE - data_inicio).days - 2), 60))
            data_liq_esperada = data_inicio + timedelta(days=dias_apos_inicio + random.randint(2, 15))
            if tem_problema:
                # ~20% das URs com problema para atingir ~10% do valor total
                r = random.random()
                if r < 0.80:
                    tipo = "LIQUIDACAO_TOTAL"
                elif r < 0.88:
                    tipo = random.choice(["CHARGEBACK_PRE_LIQUIDACAO", "CHARGEBACK_POS_LIQUIDACAO"])
                elif r < 0.94:
                    tipo = "NAO_LIQUIDADA"
                else:
                    tipo = "LIQUIDACAO_PARCIAL"
            else:
                tipo = "LIQUIDACAO_TOTAL"

        evento = gerar_evento(tipo, valor_ur, data_liq_esperada)
        valor_chargeback = evento["valor_chargeback"]

        is_chargeback = (
            tipo in ("CHARGEBACK_PRE_LIQUIDACAO", "CHARGEBACK_POS_LIQUIDACAO") and valor_chargeback > 0
        ) or (tipo == "UR_PREVISTA" and valor_chargeback > 0)
        chargeback_data = data_liq_esperada.strftime("%Y-%m-%d") if is_chargeback else ""
        chargeback_motivo = "Contestação" if is_chargeback else ""

        # valor_ur_atual: para chargeback = valor - chargeback; para parcial = valor_liquidado (efetivamente recebido)
        if tipo == "LIQUIDACAO_PARCIAL":
            valor_ur_atual = evento["valor_liquidado"]
        else:
            valor_ur_atual = round(valor_ur - evento["valor_chargeback"], 2)

        linha = {
            "estabelecimento_cnpj": cnpj,
            "estabelecimento_nome": nome,
            "contrato_id": contrato_id,
            "contrato_numero": contrato_numero,
            "data_inicio": data_inicio.strftime("%Y-%m-%d"),
            "data_fim": data_fim.strftime("%Y-%m-%d"),
            "ur_id": ur_id,
            "client_id": client_id,
            "merchant_id": merchant_id,
            "credenciadora": random.choice(CREDENCIADORAS),
            "bandeira": random.choice(BANDEIRAS),
            "data_contrato": data_inicio.strftime("%Y-%m-%d"),
            "data_liquidacao_esperada": data_liq_esperada.strftime("%Y-%m-%d"),
            "data_liquidacao_efetiva": evento["data_evento"],
            "tipo_evento": tipo,
            "valor_ur_original": valor_ur,
            "valor_ur_atual": valor_ur_atual,
            "valor_esperado": evento["valor_esperado"],
            "valor_liquidado": evento["valor_liquidado"],
            "valor_chargeback": valor_chargeback,
            "eh_futuro": data_liq_esperada > HOJE,
            "chargeback_data": chargeback_data,
            "chargeback_motivo": chargeback_motivo,
        }

        valor_total_contrato += valor_ur
        linhas.append(linha)

    # Registra dados do contrato (valor total = meta, coerente com soma das URs)
    contratos.append({
        "contrato_id": contrato_id,
        "contrato_numero": contrato_numero,
        "estabelecimento_cnpj": cnpj,
        "estabelecimento_nome": nome,
        "client_id": client_id,
        "data_inicio": data_inicio.strftime("%Y-%m-%d"),
        "data_fim": data_fim.strftime("%Y-%m-%d"),
        "valor_total": round(valor_total_contrato, 2),
        "qtd_urs": 100,
    })

with open("massa_ur.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=linhas[0].keys())
    writer.writeheader()
    writer.writerows(linhas)

with open("massa_contratos.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=contratos[0].keys())
    writer.writeheader()
    writer.writerows(contratos)

# Copia para public/ (app usa esses arquivos)
shutil.copy("massa_ur.csv", "../public/massa_ur.csv")
shutil.copy("massa_contratos.csv", "../public/massa_contratos.csv")

print(f"Arquivos gerados com sucesso. (HOJE = {HOJE.strftime('%d/%m/%Y')})")
print(f"  - massa_ur.csv: {len(linhas)} URs")
print(f"  - massa_contratos.csv: {len(contratos)} contratos (valor_total = meta)")
print(f"  - Copiados para public/")
