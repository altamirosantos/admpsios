# 🧪 Guia de Testes - Validar Solução de Cache

## ✅ Checklist Rápido

Antes de começar, certifique-se que:
- [ ] Código foi compilado (sem erros TypeScript)
- [ ] App foi reiniciada
- [ ] Hard refresh da página (`Ctrl+Shift+R` no Chrome)

---

## 🖥️ Teste 1: Validar Headers HTTP

**Objetivo:** Confirmar que os headers de no-cache estão sendo enviados

**Passos:**

1. Abra a pesquisa no Chrome
2. Pressione `F12` para abrir DevTools
3. Vá para a aba **Network**
4. **Recarregue** a página (`F5`)
5. Procure por uma requisição do Supabase (começará com `rest/v1/` ou similar)
6. Clique na requisição
7. Vá para a aba **Headers**
8. Procure por `cache-control` em **Request Headers**

**Esperado:**
```
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
pragma: no-cache
expires: 0
```

**Se não vê esses headers:**
- ❌ O interceptor não foi registrado corretamente
- Verifique `app.module.ts` → HTTP_INTERCEPTORS

---

## 📋 Teste 2: Verificar Console Logs

**Objetivo:** Confirmar que o componente está carregando dados corretamente

**Passos:**

1. Abra a pesquisa no Chrome
2. Pressione `F12` → Aba **Console**
3. Observe os logs iniciais:

**Esperado ver:**
```
📋 Iniciando carregamento do questionário NR-1 com token: abc-123-def...
✅ Questionário carregado com sucesso: {
  nomeAplicacao: "Diagnóstico Megaclip 3",
  totalPerguntas: 50,
  tela: "IDENTIFICACAO",
  timestamp: "27/09/2026 14:32:05"
}
```

**Se não vê:**
- ❌ Carregamento falhou
- Veja se há erros vermelhos no console
- Verifique token está correto

---

## ✅ Teste 3: Navegação Entre Perguntas

**Objetivo:** Validar que pergunta muda ao clicar "Próxima"

**Passos:**

1. Inicie a pesquisa
2. Preencha setor (identificação)
3. Clique em uma opção de resposta
4. **Clique "Próxima"**
5. Observe console: deve ver log `✅ Índice atualizado para: 2 de 50`

**Esperado:**
```
Console:
✅ Índice atualizado para: 2 de 50

Tela:
✅ Pergunta muda para pergunta 2
✅ Opções mudam para pergunta 2
✅ Resposta anterior não aparece (pergunta 2 ainda não respondida)
```

**Se pergunta NÃO mudar:**
- ❌ Ainda há cache
- Tente hard refresh: `Ctrl+Shift+R`
- Ou limpe cache: DevTools → Application → Clear storage → Clear all

---

## ⬅️ Teste 4: Voltar Para Pergunta Anterior

**Objetivo:** Validar que volta corretamente e mostra resposta anterior

**Passos:**

1. Na pergunta 2, clique "Anterior"
2. Observe console: deve ver log `⬅️ Voltando para pergunta: 1 de 50`

**Esperado:**
```
Console:
⬅️ Voltando para pergunta: 1 de 50

Tela:
✅ Volta para pergunta 1
✅ Opção que havia selecionado antes está marcada
```

---

## 🔄 Teste 5: Múltiplas Navegações

**Objetivo:** Validar que cache não interfere com múltiplas mudanças

**Passos:**

1. Navegue rapidamente: 1 → 2 → 3 → 2 → 1 → 3
2. Observe em cada mudança:
   - ✅ Pergunta muda corretamente?
   - ✅ Opções mostram corretas?
   - ✅ Respostas aparecem quando volta?

**Esperado:**
```
✅ Nenhuma desincronização
✅ Sempre mostra pergunta correta
✅ Respostas persistem corretamente
```

---

## 🌍 Teste 6: Limpar Tudo e Testar Novamente

**Objetivo:** Validar que mesmo após limpar cache, tudo funciona

**Passos:**

1. Abra DevTools (`F12`)
2. Vá para **Application**
3. Clique em **Clear storage** (ou "Clear site data")
4. Selecione tudo: Cache, Cookies, Storage, etc
5. Clique **Clear**
6. Recarregue a página
7. Teste novamente: navegação, opções, respostas

**Esperado:**
```
✅ Funciona perfeitamente sem nada cacheado
✅ Headers de no-cache evitam novo cache
```

---

## 💾 Teste 7: Validar Cache Response Headers

**Objetivo:** Confirmar que o servidor NÃO está enviando cache-control permissivo

**Passos:**

1. DevTools → Network
2. Clique em requisição Supabase
3. Vá para **Response Headers**
4. Procure por `cache-control`

**Esperado:**
```
Pode ter qualquer valor no Response Headers
(não importa o servidor, request headers são o que controla)
```

**Importante:** 
- Os **Request Headers** (que adicionamos) são o que importa
- Eles forçam o navegador a não cachear
- Mesmo que servidor envie `cache-control: max-age=3600`, não será cacheado

---

## 🐛 Teste 8: Reproduzir Bug Antigo

**Objetivo:** Confirmar que o bug antigo não existe mais

**Passos:**

1. Abra pesquisa normalmente (NÃO em aba anônima)
2. Responda pergunta 1
3. Clique "Próxima" 5 vezes
4. Volte para pergunta 1

**Antes (❌ Bug):**
```
Pergunta 1 mostraria sempre (mesmo na pergunta 5)
```

**Depois (✅ Corrigido):**
```
Pergunta muda corretamente
Resposta da pergunta 1 aparece quando volta
```

---

## 📊 Teste 9: Múltiplos Navegadores

**Objetivo:** Validar que funciona em todos os navegadores

| Navegador | Teste | Status |
|-----------|-------|--------|
| Chrome | Navegue 1→2→3 | [ ] ✅ ou [ ] ❌ |
| Edge | Navegue 1→2→3 | [ ] ✅ ou [ ] ❌ |
| Firefox | Navegue 1→2→3 | [ ] ✅ ou [ ] ❌ |
| Safari | Navegue 1→2→3 | [ ] ✅ ou [ ] ❌ |
| Chrome Mobile | Navegue 1→2→3 | [ ] ✅ ou [ ] ❌ |

**Esperado:** Todos ✅

---

## 🎯 Teste 10: Teste Stress - Cache Buster

**Objetivo:** Validar que mesmo sob requisições rápidas, não há cache

**Passos:**

1. Clique **rapidamente** em "Próxima" 10 vezes
2. Observe se alguma pergunta repetiu

**Esperado:**
```
✅ Nenhuma repetição
✅ Perguntas avançam 1, 2, 3, 4, 5...
✅ Sem pular ou voltar involuntariamente
```

---

## 📝 Se Encontrar Problema

### Problema: Ainda não muda em Chrome Normal
**Diagnóstico:**
1. Verifique DevTools → Network → Headers
2. Vê `cache-control: no-store...`?
   - **SIM** → Cache foi desabilitar, problema é outro (pode ser JavaScript)
   - **NÃO** → Interceptor não foi registrado

**Solução:**
- Verifique `app.module.ts`
- Confirme que `HTTP_INTERCEPTORS` está lá
- Recompile a app

### Problema: Vê headers mas ainda cacheia
**Diagnóstico:**
1. Limpe cache completamente: DevTools → Application → Clear all
2. Hard refresh: `Ctrl+Shift+R`
3. Teste novamente

**Se ainda não funcionar:**
- Pode haver outro interceptor conflitante
- Procure por outro HTTP_INTERCEPTORS em outros módulos

### Problema: Muitos logs no console
**Diagnóstico:**
- Logs foram adicionados para DEBUG
- Se ficar muito poluído, pode ser removido posteriormente
- Por enquanto, ajuda a identificar problemas

---

## ✔️ Checklist de Aprovação

Marque quando testado e passou:

### Headers
- [ ] Vê `cache-control: no-store...` em requisições Supabase
- [ ] Headers aparecem em TODAS as requisições HTTP

### Console Logs
- [ ] Vê `📋 Iniciando carregamento...`
- [ ] Vê `✅ Questionário carregado com sucesso:`
- [ ] Vê `✅ Índice atualizado para: X de 50` ao clicar Próxima

### Navegação
- [ ] Pergunta muda ao clicar "Próxima"
- [ ] Pergunta muda ao clicar "Anterior"
- [ ] Respostas persistem quando volta

### Chrome Normal
- [ ] Funciona igual ao Chrome Anônimo (CRÍTICO!)
- [ ] Sem necessidade de hard refresh
- [ ] Sem necessidade de limpar cache

### Múltiplos Navegadores
- [ ] Edge ✅
- [ ] Firefox ✅
- [ ] Chrome ✅
- [ ] Safari ✅

### Stress Test
- [ ] Múltiplas mudanças rápidas funcionam
- [ ] Nenhuma desincronização

---

## 🎉 Sucesso!

Quando todos os testes passarem:

✅ Bug de cache **RESOLVIDO**  
✅ Funciona em Chrome Normal  
✅ Funciona em todos os navegadores  
✅ Pronto para produção  

**Próximo passo:**
- Deploy em staging/produção
- Validar com usuários reais
- Monitorar console para erros

