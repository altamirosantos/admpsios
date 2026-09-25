# 🧪 Guia de Testes - Link Único e QR Code

## ✅ Teste Rápido (Manual)

### 1️⃣ Verificar se os botões aparecem

```
URL: http://localhost:4200/admin/pages/aplicacoes-nr1

1. Na tabela, coluna "Ações"
2. Devem aparecer 4 botões:
   ✓ 🔗 (links) - cinza
   ✓ 📎 (external-link) - azul  ← NOVO
   ✓ 📱 (qrcode) - amarelo      ← NOVO
   ✓ 🔄 (sync) - verde

3. Passar mouse em cada botão:
   ✓ Tooltips devem aparecer
   ✓ 📎 → "Gerar link único"
   ✓ 📱 → "Gerar QR code"
```

### 2️⃣ Teste do Botão "Gerar Link Único" (📎)

```
1. Clique no botão 📎 de uma aplicação
2. Diálogo deve abrir com:
   ✓ Título: "Link único de acesso à aplicação"
   ✓ Nome da aplicação
   ✓ URL no formato: https://dominio/aplicacao/nr1/{UUID}
   ✓ Instruções de uso
   ✓ Botão "Copiar link"

3. Clique em "Copiar link"
   ✓ Deve notificar: "Copiado para a área de transferência"
   ✓ Cole em editor de texto (Ctrl+V)
   ✓ Verifique se a URL está completa

4. Feche o diálogo (X ou Fechar)
```

### 3️⃣ Teste do Botão "Gerar QR Code" (📱)

```
1. Clique no botão 📱 de uma aplicação
2. Diálogo deve abrir com:
   ✓ Título: "QR code de acesso à aplicação"
   ✓ Nome da aplicação
   ✓ QR code visual (280x280)
   ✓ URL pequena na base (referência)
   ✓ Botão "Baixar PNG"

3. Clique em "Baixar PNG"
   ✓ Deve fazer download: qrcode-aplicacao-nr1-{nome}.png
   ✓ Verifique se o arquivo foi criado em Downloads

4. Teste com leitor de QR:
   ✓ Use celular com câmera + Google Lens
   ✓ OU use app específico de QR
   ✓ Deve reconhecer URL: /aplicacao/nr1/{UUID}

5. Feche o diálogo
```

---

## 🔍 Teste de Funcionalidade Completa

### Cenário: Validar fluxo end-to-end

```
PASSO 1: Gerar Link
├─ Em /admin/pages/aplicacoes-nr1
├─ Clique em 📎 para uma aplicação ativa
├─ Copie o link gerado
├─ Cole em navegador (nova aba)
└─ Deve carregar: /aplicacao/nr1/{id}
   └─ Tela de preenchimento de CPF (novo fluxo)

PASSO 2: Validar QR Code  
├─ Clique em 📱 para mesma aplicação
├─ Veja o QR code exibido
├─ Baixe o PNG
├─ Abra o PNG em visualizador
├─ Use leitor de QR no celular
└─ Deve reconhecer a URL acima

PASSO 3: Validar Componentes Antigos
├─ Clique em 🔗 (links)
├─ Tokens individuais devem aparecer
├─ QR code de token deve funcionar (botão 📱)
└─ Deve continuar funcionando normalmente
```

---

## 🐛 Teste de Casos Limites

### Teste 1: Aplicação sem dados

```
Situação: Aplicação GERADO (sem tokens ainda)

1. Clique em 📎 (Link Único)
   ✓ Diálogo abre normalmente
   ✓ Link é exibido
   ✓ Copiar funciona

2. Clique em 📱 (QR Code)
   ✓ QR code é exibido
   ✓ Corresponde ao mesmo link
   ✓ Download funciona

Esperado: Tudo deve funcionar (link é da aplicação, não de tokens)
```

### Teste 2: Aplicação com muitos tokens

```
Situação: Aplicação com 1000+ tokens

1. Clique em 🔗 (Ver links)
   ✓ Lista de tokens tem paginação
   ✓ Performance está ok

2. Clique em 📎 (Link Único)
   ✓ Abre rapidamente
   ✓ Sem delay

3. Clique em 📱 (QR Code)
   ✓ QR aparece rapidamente
   ✓ Download sem problemas

Esperado: Link e QR da aplicação são independentes dos tokens
```

### Teste 3: Nomes especiais de aplicação

```
Situações para testar:

a) Nome com caracteres especiais:
   "DRPS 2026 - Produção (50 col.)"
   
   1. Clique em 📱 (QR Code)
   2. Baixe PNG
   3. Nome do arquivo deve ser: 
      qrcode-aplicacao-nr1-DRPS_2026___Produ__o__50_col__.png
      (caracteres especiais substituídos por _)

b) Nome muito longo:
   "[CONFIDENCIAL] Diagnóstico Psicossocial Ocupacional - Filial São Paulo"
   
   1. Deve exibir normalmente no diálogo
   2. Nome do arquivo deve truncar com segurança

Esperado: Sem quebras ou erros
```

### Teste 4: Responsividade

```
Desktop (1920x1080):
✓ Botões em linha horizontal
✓ Diálogos centrados
✓ QR code legível

Tablet (768px):
✓ Botões com flex-wrap
✓ Diálogos adaptem
✓ QR code ainda legível

Mobile (375px):
✓ Botões dispostos (possível quebra de linha)
✓ Diálogos fullscreen ou modal
✓ QR code touch-friendly
✓ Texto scrollável se necessário
```

---

## 📊 Checklist de Validação

### Componente TypeScript

```
✓ Propriedades criadas:
  - linkAplicacaoDialog
  - aplicacaoParaLink
  - qrAplicacaoDialog
  - aplicacaoParaQr

✓ Métodos criados:
  - linkAcessoAplicacao()
  - qrCodeAplicacao()
  - abrirLinkAplicacao()
  - abrirQrAplicacao()
  - copiarLinkAplicacao()
  - baixarQrAplicacao()

✓ Métodos auxiliares preservados:
  - linkDoToken()
  - qrCodeUrl()
  - abrirQrCode()
  - baixarQrCode()

✓ Sem erros de compilação
✓ Tipos TypeScript corretos
```

### Template HTML

```
✓ Botões adicionados (2):
  - Botão Link (📎)
  - Botão QR (📱)

✓ Diálogos adicionados (2):
  - linkAplicacaoDialog
  - qrAplicacaoDialog

✓ Conteúdo do diálogo Link:
  - Nome da aplicação
  - URL formatada
  - Instruções
  - Botão copiar

✓ Conteúdo do diálogo QR:
  - Nome da aplicação
  - QR code visual
  - URL de referência
  - Botão download

✓ Sem erros de compilação (novos)
✓ Responsividade OK
```

### Funcionalidades

```
✓ Clique no botão abre diálogo
✓ Diálogo exibe corretamente
✓ Link/QR gerado com dados corretos
✓ Copiar link funciona
✓ Download QR funciona
✓ Fechar diálogo funciona
✓ Fechar com X funciona
✓ Modal backdrop funciona
```

---

## 🚀 Teste de Produção

### Antes de Deploy

```
1. Build sem erros
   ng build --configuration production
   ✓ Sem warnings críticos

2. Teste de Performance
   ✓ Listagem de aplicações carrega < 2s
   ✓ Clique em botão responde < 500ms
   ✓ QR code renderiza < 1s
   ✓ Download QR < 2s

3. Teste de Compatibilidade
   ✓ Chrome/Chromium
   ✓ Firefox
   ✓ Safari
   ✓ Edge

4. Teste de Segurança
   ✓ URLs não expostas em logs
   ✓ Sem XSS nas URLs dinâmicas
   ✓ CORS configurado se necessário
   ✓ Rate limiting para copiar/download

5. Teste de Acessibilidade
   ✓ Botões tem aria-labels
   ✓ Diálogos com roles ARIA
   ✓ Teclado navegável
   ✓ Screen readers funcionam
```

---

## 📝 Relatório de Teste

### Template para Documentar

```
Data: ___/___/____
Testador: ____________

| Teste | Status | Observações |
|-------|--------|-------------|
| Botão 📎 aparece | ✓/✗ | |
| Botão 📱 aparece | ✓/✗ | |
| Diálogo Link abre | ✓/✗ | |
| Diálogo QR abre | ✓/✗ | |
| URL gerada correta | ✓/✗ | |
| QR renderiza | ✓/✗ | |
| Copiar link funciona | ✓/✗ | |
| Download QR funciona | ✓/✗ | |
| Sem erros console | ✓/✗ | |
| Responsivo mobile | ✓/✗ | |

Assinado: ____________
```

---

## 🎯 Conclusão

Se todos os testes passarem com ✓, a feature está pronta para:

1. ✅ Merge em desenvolvimento
2. ✅ Deploy em staging
3. ✅ Testes de aceitação
4. ✅ Deploy em produção

**Status:** Pronto para teste! 🎉
