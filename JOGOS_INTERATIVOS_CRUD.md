# CRUD de Jogos Interativos

## Objetivo

Implementação no projeto `adminpsios` de um CRUD mestre-detalhe para:

- `jogo_interativo`
- `questoes_interativo`

A tela principal é a listagem de `jogo_interativo`. Ao selecionar um jogo, a parte inferior da tela exibe e permite gerenciar as perguntas relacionadas na tabela `questoes_interativo`.

## Estrutura criada

### Serviço

- `src/app/demo/service/jogo-interativo.service.ts`

Responsável por:

- listar, criar, editar e excluir jogos interativos
- listar, criar, editar e excluir perguntas por jogo
- encapsular o acesso ao Supabase via `SupabaseService`

### Tela

- `src/app/demo/components/pages/jogo-interativo-index/`

Arquivos:

- `jogo-interativo-index.component.ts`
- `jogo-interativo-index.component.html`
- `jogo-interativo-index.component.scss`
- `jogo-interativo-index.module.ts`
- `jogo-interativo-index-routing.module.ts`

## Rota

A tela foi registrada em:

- `src/app/demo/components/pages/pages-routing.module.ts`

Path:

- `/pages/jogos-interativos`

## Menu

O item foi adicionado no menu principal em:

- `src/app/layout/app.menu.component.ts`

Label:

- `Jogos Interativos`

## Comportamento da tela

### Bloco superior

Listagem de `jogo_interativo` com:

- `nome`
- `titulo`
- `created_at`
- ações de editar e excluir
- botão `Novo jogo`

### Bloco inferior

Listagem de `questoes_interativo` do jogo selecionado com:

- `question`
- `options`
- `correct_answer`
- `explanation`
- `insight`
- ações de editar e excluir
- botão `Nova pergunta`

## Regras da pergunta

No formulário de pergunta:

- `question` é obrigatório
- `options` é editado como uma opção por linha
- são exigidas pelo menos 2 opções
- `correct_answer` é o índice da opção correta, começando em `0`

Exemplo:

- opções:
  - linha 1: `Mito`
  - linha 2: `Verdade`
- `correct_answer = 1`

## Dependências utilizadas

Seguindo o padrão já existente da aplicação:

- `PrimeNG Table`
- `PrimeNG Dialog`
- `PrimeNG Toolbar`
- `PrimeNG Toast`
- `PrimeNG Button`
- `PrimeNG InputText`
- `PrimeNG InputTextarea`
- `PrimeNG InputNumber`

## Tabelas esperadas

```sql
CREATE TABLE jogo_interativo (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questoes_interativo (
  id SERIAL PRIMARY KEY,
  jogo_interativo_id INTEGER NOT NULL REFERENCES jogo_interativo(id),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  insight TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Observações futuras

- Se houver exclusão de um jogo com perguntas vinculadas, o banco precisa permitir essa exclusão conforme sua regra de integridade. Caso contrário, será necessário remover as perguntas antes ou alterar a constraint.
- Se no futuro houver paginação, filtros ou busca por nome/título, a base ideal para expansão é o componente `jogo-interativo-index.component.ts`.
- Se quiser integrar upload, ordenação manual ou versionamento das perguntas, a estrutura atual já separa bem jogo e questões para extensão.
