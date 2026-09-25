# 🔗 Funcionalidades de Link Único e QR Code - Aplicações NR-1

## 📋 Resumo das Alterações

Adicionadas 2 novas ações na listagem de aplicações NR-1 (`/pages/aplicacoes-nr1`):

1. **Gerar Link Único** - Link direto para acessar a aplicação via CPF
2. **Gerar QR Code** - QR code para compartilhar facilmente

---

## 🆕 O Que Foi Adicionado

### Componente TypeScript (`aplicacao-nr1-index.component.ts`)

**Propriedades Novas:**
```typescript
// Link único da aplicação
linkAplicacaoDialog = false;
aplicacaoParaLink: AplicacaoNr1 | null = null;

// QR code único da aplicação
qrAplicacaoDialog = false;
aplicacaoParaQr: AplicacaoNr1 | null = null;
```

**Métodos Novos:**

```typescript
/**
 * URL da aplicação (acesso intermediário com CPF)
 * Formato: /aplicacao/nr1/{aplicacao_nr1_id}
 */
linkAcessoAplicacao(aplicacaoId: string): string

/**
 * QR code em PNG da aplicação (via API pública)
 * Gera QR code que aponta para linkAcessoAplicacao()
 */
qrCodeAplicacao(aplicacaoId: string, tamanho = 220): string

/**
 * Abre diálogo com o link único da aplicação
 */
abrirLinkAplicacao(aplicacao: AplicacaoNr1): void

/**
 * Abre diálogo com o QR code único da aplicação
 */
abrirQrAplicacao(aplicacao: AplicacaoNr1): void

/**
 * Copia o link da aplicação para a área de transferência
 */
async copiarLinkAplicacao(): Promise<void>

/**
 * Baixa o PNG do QR code da aplicação
 */
baixarQrAplicacao(): void
```

### Template HTML (`aplicacao-nr1-index.component.html`)

**Botões de Ação Novos (na coluna de ações da tabela):**

```html
<!-- Botão: Gerar Link Único -->
<button pButton pRipple icon="pi pi-external-link" 
    class="p-button-rounded p-button-info"
    (click)="abrirLinkAplicacao(aplicacao)" 
    pTooltip="Gerar link único">
</button>

<!-- Botão: Gerar QR Code -->
<button pButton pRipple icon="pi pi-qrcode" 
    class="p-button-rounded p-button-warning"
    (click)="abrirQrAplicacao(aplicacao)" 
    pTooltip="Gerar QR code">
</button>
```

**Diálogos Novos:**

1. **Diálogo do Link Único**
   - Mostra o link completo
   - Botão para copiar
   - Instruções de uso
   - Modal reutilizável

2. **Diálogo do QR Code**
   - Exibe QR code em alta resolução (280x280)
   - Botão para baixar PNG
   - Link pequeno na base (referência)
   - Modal reutilizável

---

## 📍 Como Usar

### Na Listagem de Aplicações

```
1. Acesse: Admin → Aplicações NR-1
2. Localize a aplicação desejada
3. Na coluna "Ações", clique em:
   - 📎 (Link) para copiar o link único
   - 📱 (QR Code) para baixar o QR code
```

### Compartilhando com Colaboradores

**Opção 1: Link Direto**
```
Copie o link e compartilhe:
https://seu-dominio/aplicacao/nr1/{UUID-APLICACAO}

Colaborador digita seu CPF e acessa o questionário
```

**Opção 2: QR Code**
```
Baixe o PNG e imprima/compartilhe digitalmente:
- Colaborador escaneia QR code
- Vai direto para o formulário de CPF
- Continua normalmente com o questionário
```

---

## 🔄 Fluxo de Uso

### Cenário: Admin compartilha questionário com 50 colaboradores

```
1️⃣ Admin acessa /pages/aplicacoes-nr1
   
2️⃣ Localiza aplicação "DRPS 2026 - Produção"
   
3️⃣ Clica botão "Link Único" (📎)
   → Abre diálogo com a URL
   → Copia para área de transferência
   → Cola em email/WhatsApp/comunicado
   
4️⃣ OU Clica botão "QR Code" (📱)
   → Abre diálogo com QR
   → Baixa PNG
   → Imprime e cola em murais/avisos
   
5️⃣ Colaborador acessa:
   - Via link: coloca na URL/clica no botão
   - Via QR: escaneia com celular
   
6️⃣ Preenchimento do CPF (novo fluxo intermediário)
   
7️⃣ Redirecionamento para questionário
```

---

## 🎨 Componentes Visuais

### Botões na Tabela

```
Ações agora tem 4 botões:
┌─────────────────────────────────────┐
│ 🔗 (links)     - Ver tokens/e-mails │
│ 📎 (external)  - Link único         │ ← NOVO
│ 📱 (qrcode)    - QR code único      │ ← NOVO
│ 🔄 (sync)      - Alterar status     │
└─────────────────────────────────────┘

Cores dos botões:
🔗 Secundário (cinza)
📎 Info (azul) - NOVO
📱 Aviso (amarelo) - NOVO
🔄 Help (verde)
```

### Diálogos Pop-up

**Diálogo do Link:**
```
┌─────────────────────────────────────┐
│ Link único de acesso à aplicação    │
├─────────────────────────────────────┤
│ Aplicação: DRPS 2026 - Produção     │
│                                     │
│ Compartilhe este link:              │
│ ┌───────────────────────────────┐   │
│ │ https://dominio/aplicacao/    │   │
│ │ nr1/550e8400-e29b-41d4-...    │   │
│ └───────────────────────────────┘   │
│                                     │
│ Instruções:                         │
│ • Colaboradores acessam o link      │
│ • Preenchem seu CPF                 │
│ • São redirecionados para o quest.  │
│ • Podem retomar a resposta          │
└─────────────────────────────────────┘
  Fechar         [Copiar link]
```

**Diálogo do QR Code:**
```
┌──────────────────────────────┐
│ QR code de acesso à aplic.   │
├──────────────────────────────┤
│ DRPS 2026 - Produção         │
│                              │
│    ██████████████████        │
│    ██          ██████        │
│    ██ ████████ ██████        │
│    ██ ██    ██ ██████        │
│    ██ ████████ ██████        │
│    ██          ██████        │
│    ██████████████████        │
│                              │
│ https://dominio/aplicacao/   │
│ nr1/550e8400-e29b-41d4-...   │
└──────────────────────────────┘
  Fechar      [Baixar PNG]
```

---

## 💻 Integração Técnica

### URLs Geradas

**Link de Acesso (Intermediário):**
```
https://seu-dominio/aplicacao/nr1/{UUID-APLICACAO}

Exemplo:
https://admin.psios.com.br/aplicacao/nr1/550e8400-e29b-41d4-a716-446655440000
```

**Link do Questionário (Direto):**
```
https://seu-dominio/pesquisa/nr1/{TOKEN}

Exemplo:
https://admin.psios.com.br/pesquisa/nr1/6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

**QR Code (via API pública):**
```
https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data={ENCODED_URL}
```

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│ Admin clica em "Link Único" ou "QR Code"               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─→ linkAcessoAplicacao(aplicacao.id)
                 │   └─→ /aplicacao/nr1/{id}
                 │
                 ├─→ qrCodeAplicacao(aplicacao.id)
                 │   └─→ API QRServer com a URL acima
                 │
                 └─→ Abre diálogo com resultado
```

---

## 🔧 Modificações de Arquivo

### Arquivos Alterados

1. **`aplicacao-nr1-index.component.ts`**
   - ✅ Adicionadas 2 propriedades (dialog + aplicação selecionada)
   - ✅ Adicionados 6 métodos novos
   - ✅ Métodos existentes mantidos

2. **`aplicacao-nr1-index.component.html`**
   - ✅ Adicionados 2 botões na coluna de ações
   - ✅ Adicionados 2 diálogos p-dialog
   - ✅ Template para exibição de link
   - ✅ Template para exibição de QR code

### Arquivos NÃO Alterados

- ✅ `aplicacao-nr1-index.module.ts` (nenhuma dependência nova)
- ✅ `aplicacao-nr1-index.component.scss` (estilos via PrimeNG)
- ✅ `aplicacao-nr1-index-routing.module.ts` (sem mudanças)
- ✅ `aplicacao-nr1.service.ts` (serviço não precisa alterar)

---

## 📦 Dependências

**Nenhuma dependência NPM adicional!**

Utiliza:
- ✅ Angular (já instalado)
- ✅ PrimeNG (já instalado)
- ✅ API pública QRServer (sem backend necessário)

---

## ✅ Checklist de Validação

- [x] Botões adicionados à tabela
- [x] Diálogos criam-se corretamente
- [x] Links são gerados com formato correto
- [x] QR codes são exibidos
- [x] Funcionalidade de copiar funciona
- [x] Download do QR code funciona
- [x] Métodos auxiliares funcionam
- [x] Sem erros de compilação TypeScript
- [x] Responsivo (mobile e desktop)

---

## 🎯 Benefícios

```
ANTES:
├─ Admin precisa entrar em "Ver links"
├─ Copiar link de token em token
├─ Enviar por email individual
└─ Usuário acessa /pesquisa/nr1/:token direto

AGORA:
├─ Copiar link da aplicação inteira
├─ Compartilhar em massa (email/WhatsApp)
├─ QR code pronto para imprimir
└─ Usuário acessa /aplicacao/nr1/:id
   └─ Preenche CPF (novo fluxo intermediário)
   └─ Redireciona para questionário
   └─ Pode retomar resposta anterior
```

---

## 📝 Próximas Melhorias (Opcional)

```
Sugestões para futuro:

1. Gerar link com parâmetros adicionais (email, código)
2. Histórico de compartilhamentos
3. Rastreamento de acessos via QR
4. Customização visual do QR (logo, cores)
5. Encurtador de URL customizado
6. Analytics de cliques no link
7. Expiração de links após N dias
8. Whitelist de IPs/domínios
9. Variações de QR por idioma
10. Integração com API de SMS (WhatsApp Business)
```

---

**✨ Funcionalidade implementada e pronta para uso!**

**Para usar:**
1. Acesse Admin → Aplicações NR-1
2. Clique no botão 📎 ou 📱 da aplicação
3. Copie o link ou baixe o QR code
4. Compartilhe com colaboradores

**Sucesso! 🎉**
