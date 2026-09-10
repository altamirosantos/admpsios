# Módulo NR-1 / DRPS — Documentação técnica

Documentação do **Diagnóstico de Riscos Psicossociais (DRPS)** conforme a **NR-1**, implantado
no adminpsios (frontend) + supabase-schema (backend). Escrita para orientar futuras inserções por IA.

> Base do modelo: planilha `Modelo NR 01 50P - Atual 13F 29-05.xlsx` (13 fatores de risco / 50 perguntas).
> O objetivo foi reproduzir **fielmente as regras de cálculo da planilha** no Supabase e expor via painel.

---

## 1. Conceito e regra de negócio (fiel à planilha)

O DRPS avalia **13 fatores de risco psicossociais (tópicos)** através de **50 perguntas**.
Cada resposta usa uma **escala de frequência de 5 pontos (0 a 4)**, apenas no formulário:
**0=Nunca, 1=Raramente, 2=Ocasionalmente, 3=Frequentemente, 4=Sempre**.

**Cadeia de cálculo:**
1. **Resposta bruta (0..4)** = frequência escolhida pelo colaborador (peso da opção).
2. **Nível bruto** (classificação da frequência): resposta ≥3 → **Alta (3)**, =2 → **Média (2)**, ≤1 → **Baixa (1)**.
3. **Inversão sobre o NÍVEL:** se a pergunta é `INVERTIDA` → inverte o nível (`4 - nível`: Baixa↔Alta, Média fica); se `DIRETA` → mantém.
   - *Direta:* "quanto maior a frequência, maior o risco". *Invertida:* "quanto maior a frequência, menor o risco".
   - **Atenção:** a inversão é aplicada sobre o **nível classificado**, NÃO sobre o número bruto 0..4.
4. **GravidadeNum por resposta** = o nível resultante (Alta=3 / Média=2 / Baixa=1).
5. **Resumo por Tópico:** média simples da GravidadeNum das respostas do tópico → **gravidade média**.
   - Classe: ≥2.5 Alta, ≥1.5 Média, senão Baixa.
   - **O dashboard e os gráficos exibem sempre em Baixa/Média/Alta — a escala 0..4 nunca aparece no dashboard.**
5. **Probabilidade (1..3):** avaliação qualitativa **inserida manualmente pelo psicólogo**, por setor e por tópico.
6. **Matriz de risco (NR-1):** `risco = Gravidade × Probabilidade` (produto 1..9):
   - ≥9 **Crítico**, ≥6 **Alto**, ≥3 **Médio**, senão **Baixo**. Sem probabilidade informada → **Pendente**.

**Importante (decisão de arquitetura das sessões):** setor e cargo **não** ficam fixos na aplicação;
são informados pelo **colaborador** no início do questionário. As métricas agrupam pelo **setor da resposta**
(equivale ao "slicer por setor" da planilha).

---

## 2. Modelo de dados (Supabase / Prisma)

Todas as tabelas no schema `public`. Espelhadas em `supabase-schema/prisma/schema.prisma`.

| Tabela | Papel |
|---|---|
| `aplicacao_nr1` | Lote de aplicação (filial, nome, status, `video_url`). status ∈ GERADO/ATIVO/ENCERRADO/CANCELADO. Só **ATIVO** libera respostas. |
| `aplicacao_anonimo_nr1` | 1 token anônimo por colaborador. Campos: `token` (UUID), `respondido`, `setor_id`/`cargo_id` (da resposta), e o **vínculo temporário** `colaborador_id`/`email` (para disparo, apagado ao encerrar). |
| `perguntas_nr1` | As 50 perguntas. `fator_risco` (tópico), `tipo_resposta` (LIKERT_5), `logica` (DIRETA/INVERTIDA), `ordem`, `obrigatoria`. |
| `opcao_resposta_nr1` | Opções por pergunta com `peso` = frequência 0..4 (Nunca=0 .. Sempre=4). |
| `item_questionario_nr1` | Respostas submetidas (FK RESTRICT p/ pergunta e opção → protege catálogo). |
| `probabilidade_setor_nr1` | Probabilidade (1..3) por `(aplicacao, setor_id, fator_risco)`. `setor_id` NULL = visão geral. Índices únicos parciais (com setor / geral). |

**Campos-chave adicionados nas sessões:** `perguntas_nr1.logica`, `aplicacao_nr1.video_url`,
`aplicacao_anonimo_nr1.{colaborador_id,email,setor_id,cargo_id}`, `probabilidade_setor_nr1.setor_id`.

---

## 3. RPCs e artefatos SQL (`supabase-schema/sql/`)

Aplicar **nesta ordem** num banco novo (todos idempotentes onde possível):

1. `migracao_metricas_nr1.sql` — coluna `logica` em perguntas + tabela `probabilidade_setor_nr1` (com `setor_id` e índices únicos parciais; reconcilia versão antiga).
2. `migracao_vinculo_setor_cargo_nr1.sql` — `colaborador_id/email/setor_id/cargo_id` em `aplicacao_anonimo_nr1`.
3. `migracao_video_aplicacao_nr1.sql` — `video_url` em `aplicacao_nr1`.
4. `seed_perguntas_nr1.sql` — as 50 perguntas (tópico + lógica extraídos da planilha) + opções **LIKERT_5 / frequência 0..4** (Nunca..Sempre). **Destrutivo**: dá `delete from perguntas_nr1` (falha se houver respostas — ver reset abaixo).
5. `calcular_metricas_nr1.sql` — RPC principal `(p_aplicacao_id, p_setor_id default null)`. Retorna por tópico: gravidade média/classe/num, probabilidade, risco final. Filtra pelo setor da resposta.
6. `upsert_probabilidade_nr1.sql` — `(p_aplicacao_id, p_fator_risco, p_probabilidade, p_setor_id default null)`. Upsert manual (índice parcial → sem `on conflict`).
7. `comparativo_setores_nr1.sql` — agrega gravidade/risco por setor (para o gráfico/quadro comparativo).
8. `listar_setores_respondidos_nr1.sql` — setores que têm respostas (alimenta o filtro do dashboard).
9. `gerar_aplicacao_por_colaboradores.sql` — cria lote + 1 token por colaborador da filial (com e-mail). `(p_nome, p_filial_id, p_status, p_video_url)`.
10. `gerar_aplicacao_com_tokens.sql` — cria lote + N tokens anônimos avulsos (por quantidade). `(..., p_video_url)`.
11. `submeter_resposta_nr1_anonima.sql` — `(p_token, p_respostas, p_setor_id, p_cargo_id)`. **Setor obrigatório**; grava setor/cargo no token.
12. `listar_setores_cargos_por_token.sql` — RPC `anon` (security definer) que retorna `{setores, cargos, video_url}` da empresa via token (evita RLS na tela pública).
13. `listar_tokens_aplicacao_nr1.sql` — tokens + vínculo (nome/e-mail) para o admin (copiar links / enviar e-mail).
14. `trigger_limpeza_vinculo_nr1.sql` — trigger AFTER UPDATE OF status: ao **ENCERRADO/CANCELADO**, zera `colaborador_id`/`email` de todos os tokens (**anonimização**). Preserva respostas e setor/cargo.

**Reset (opcional, DESTRUTIVO):** `reset_dados_nr1.sql` apaga respostas → probabilidades → tokens → aplicações → perguntas, na ordem correta das FKs. Use só com dados de teste, antes de reexecutar o seed.

> Ao reexecutar qualquer RPC cuja **assinatura mudou**, o script já faz `drop function if exists` da assinatura antiga.

---

## 4. Edge Function — envio de links por e-mail

`supabase-schema/supabase/functions/enviar-links-nr1/` (Deno + Resend).
- Body: `{ aplicacao_id, base_url, reenviar? }`. Monta `<base_url>/pesquisa/nr1/<token>` e envia via Resend.
- Só envia para tokens **com e-mail** e **não respondidos** (salvo `reenviar: true`). Marca `data_envio`.
- Secrets: `RESEND_API_KEY`, `NR1_EMAIL_FROM` (`SUPABASE_URL`/`SERVICE_ROLE_KEY` são automáticos).
- Deploy: `supabase functions deploy enviar-links-nr1`. Chamada no admin via `functions.invoke('enviar-links-nr1', ...)`.

---

## 5. Frontend (Angular)

### Serviços (`src/app/demo/service/`)
- `aplicacao-nr1.service.ts` — gerar (por colaboradores / por quantidade), listar, atualizar status, **listar tokens**, **enviar e-mails**.
- `pergunta-nr1.service.ts` / `opcao-resposta-nr1.service.ts` — CRUD do catálogo.
- `pesquisa-nr1.service.ts` — fluxo **público**: `carregarPorToken` (situação + perguntas + setores/cargos + videoUrl) e `submeterRespostas(token, respostas, setorId, cargoId)`.
- `metricas-nr1.service.ts` — `calcularMetricas(aplicacaoId, setorId?)`, `salvarProbabilidade(...)`, `listarSetores(...)`, `comparativoPorSetor(...)`.

### Telas
- **Admin — Aplicações NR-1** (`pages/aplicacao-nr1-index/`): gera lote (2 modos: por colaboradores com e-mail, ou por quantidade), campo de **vídeo YouTube**, altera status, diálogo de **links** (copiar individual/todos, **enviar por e-mail**, **QR code** por token via `api.qrserver.com`).
- **Admin — Dashboard NR-1 (DRPS)** (`pages/nr1-dashboard-index/`): seleção de aplicação + **filtro por setor**; KPIs; **Resumo por Tópico + matriz de risco** (probabilidade editável inline); **Comparativo entre Setores** (gráfico + quadro consolidado para o PGR); gráfico "Gravidade por Tópico"; **exportar PDF** (via `window.print` + CSS `@media print`). Rota `/pages/dashboard-nr1`.
- **Público — Questionário** (`components/pesquisa-nr1/`): rota **`/pesquisa/nr1/:token`** (anônima). Fluxo: CARREGANDO → IDENTIFICACAO (vídeo YouTube + escolher **setor obrigatório**/cargo) → QUESTIONARIO → AGRADECIMENTO. Estados: INVALIDO/RESPONDIDO/INDISPONIVEL/ERRO.

### URL do questionário
```
https://<dominio>/pesquisa/nr1/<TOKEN_UUID>
```

---

## 6. Conformidade legal (resumo das decisões)

- A NR-1 exige incluir riscos psicossociais no **PGR/GRO** (identificar → avaliar → controlar → monitorar), com a mesma metodologia dos demais riscos. Avaliar/apresentar **por setor** é a prática esperada (o dashboard atende via filtro + comparativo por setor).
- A norma **não exige coletar sexo/gênero** no questionário. O fluxo é **anônimo e coletivo** (LGPD). **Não** adicionar PII ao fluxo anônimo sem base legal; se houver estratificação futura, garantir mínimo de respondentes por grupo para evitar reidentificação.
- Pendência conhecida: campo `colaborador.sexo` no schema está tipado como `DateTime @db.Date` (provável erro de modelagem) — confirmar com o time o que representa antes de corrigir.

---

## 7. Escala e fidelidade — cuidados ao alterar

- **Escala de resposta = 5 pontos (0..4)**, tipo `LIKERT_5`, pesos: Nunca=0, Raramente=1,
  Ocasionalmente=2, Frequentemente=3, Sempre=4.
- A conversão para nível (Baixa/Média/Alta) e a **inversão são feitas no NÍVEL**, não no número bruto:
  `nível = resp>=3 ? Alta : resp=2 ? Média : Baixa`; se INVERTIDA, `4 - nível` (Baixa↔Alta, Média fica).
  Essa regra vive nas RPCs `calcular_metricas_nr1` e `comparativo_setores_nr1` — mantenha as duas em sincronia.
- A `logica` de cada pergunta veio da aba "Escala" da planilha (extraída 1:1). Ao editar perguntas,
  preserve `fator_risco` (tópico) e `logica` corretos — eles determinam o cálculo.
- A tela pública renderiza as opções por `ordem`/`peso` do banco; `corEscala()` usa a posição relativa
  (5 faixas de cor), então funciona com as 5 opções sem alteração. A seleção usa `opcaoId` (peso 0 é seguro).
- **Dashboard sempre em Baixa/Média/Alta** (e matriz Baixo/Médio/Alto/Crítico). Não exibir 0..4 no dashboard.
