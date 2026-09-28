# ⚡ Teste Rápido - 3 Minutos

## 🎯 Objetivo
Validar rapidamente se a solução de cache funciona

---

## ✅ Teste 1: Chrome Normal (30 segundos)

**Você tem:** Chrome aberto

**Faça:**
1. Abra a pesquisa (URL normal, NÃO anônimo)
2. Preencha setor
3. Clique em uma opção de resposta
4. **Clique "Próxima"**

**Esperado:**
- ✅ Pergunta muda?
- ✅ Opções mudam?

**Resultado:**
- [ ] SIM - Problema RESOLVIDO! 🎉
- [ ] NÃO - Vá para Teste 2

---

## ✅ Teste 2: Verificar Headers (1 minuto)

**Você tem:** Chrome com DevTools

**Faça:**
1. Pressione `F12` (abre DevTools)
2. Vá para aba **Network**
3. Recarregue a página (`F5`)
4. Procure por requisição começando com `rest/v1`
5. Clique nela
6. Vá para aba **Headers**
7. Procure por `cache-control` em **Request Headers**

**Esperado:**
```
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
```

**Resultado:**
- [ ] Vejo headers → Tudo OK
- [ ] Não vejo headers → Interceptor não registrado

---

## ✅ Teste 3: Console Logs (30 segundos)

**Você tem:** Chrome com DevTools

**Faça:**
1. DevTools ainda aberto
2. Vá para aba **Console**
3. Recarregue a página
4. Observe os primeiros logs

**Esperado:**
```
📋 Iniciando carregamento do questionário NR-1 com token: ...
✅ Questionário carregado com sucesso: { nomeAplicacao: "...", totalPerguntas: 50, ... }
```

**Resultado:**
- [ ] Vejo logs → Carregamento funcionando
- [ ] Sem logs → Pode haver erro

---

## 🎯 Resultado Final

### Se passou nos 3 testes:
```
✅ TUDO OK!
✅ Cache foi desabilitado
✅ Pergunta muda corretamente
✅ Pronto para usar
```

### Se NÃO passou:
```
1. Faça hard refresh: Ctrl+Shift+R
2. Limpe cache: DevTools → Application → Clear all
3. Teste novamente
```

---

## 📞 Se Tiver Problema

### "Pergunta não muda mesmo após teste"
1. Abra `GUIA_TESTES_CACHE.md` para testes detalhados
2. Verifique se `no-cache.interceptor.ts` foi criado
3. Verifique se `app.module.ts` registrou o interceptor
4. Recompile: `ng build`

### "Headers não aparecem no Network"
1. Verifique em **Request Headers** (não Response Headers)
2. Procure por requisição Supabase (tem `/rest/v1/`)
3. Se não achar, pode ser outro problema
4. Verifique `app.module.ts` HTTP_INTERCEPTORS

### "Vejo erros no console"
1. Abra `SOLUCAO_CACHE_NAVEGADOR_CHROME.md` para diagnóstico
2. Copie o erro
3. Procure por ele no arquivo de documentação

---

## ✔️ Sucesso!

Quando Teste 1 passa:
✅ Chrome Normal funciona  
✅ Problema RESOLVIDO  
✅ Pronto para produção  

**Parabéns! 🎉**

