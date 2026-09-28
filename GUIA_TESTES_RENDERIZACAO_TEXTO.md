# 🧪 Guia de Testes - Validar Correção de Renderização de Texto

## ✅ Checklist Rápido

Antes de começar os testes, certifique-se que:
- [ ] Código foi compilado sem erros
- [ ] Aplicação foi reiniciada (hard refresh)
- [ ] Está usando a versão atualizada do componente

---

## 🖥️ Teste 1: Navegador Desktop (Referência)

**Objetivo:** Validar que tudo funciona no navegador principal

**Passos:**
1. Abra a pesquisa no Chrome/Firefox/Edge no PC
2. Verifique que o texto muda quando clica "Próxima"
3. Verifique que volta quando clica "Anterior"
4. Marque uma opção, avance 2 perguntas, volte - deve ver opção marcada

**Esperado:**
```
✅ Texto muda SEMPRE
✅ Opções mudam SEMPRE
✅ Respostas ficam marcadas
```

---

## 📱 Teste 2: Dispositivo Mobile (Android)

**Objetivo:** Validar se o texto agora renderiza em dispositivos reais (era o problema original)

**Equipamentos:**
- Samsung A12/A13/A20/A30 (lento)
- Qualquer Android moderno
- iPhone (se houver)

**Passos:**
1. Escaneie o QR do aplicativo
2. Abra a pesquisa NR1
3. Clique na primeira opção
4. **Observe atentamente:** O texto muda?

**Esperado:**
```
✅ Texto muda na primeira pergunta → próxima
✅ Texto continua mudando em cada pergunta
✅ Respostas aparecem quando volta
```

**Se AINDA não funcionar:**
- Feche e abra o navegador (não só refresh)
- Limpe cache do navegador
- Teste em navegador diferente (Samsung Internet, Chrome, etc)

---

## 🔍 Teste 3: DevTools - Inspecionar Mudanças no DOM

**Objetivo:** Verificar tecnicamente que a mudança está acontecendo

**Passos:**
1. Abra a pesquisa no PC
2. Pressione `F12` para abrir DevTools
3. Vá para a aba "Elements"
4. Expanda `<main class="pergunta-area">`
5. Procure por `[ngSwitch]="perguntaAtual?.id"`
6. Clique em "Próxima"
7. **Observe:** A div.pergunta-card foi DESTRUÍDA e RECRIADA?

**Esperado:**
```
Antes: <main [ngSwitch]="0">
         <div class="pergunta-card">
             <h2>Pergunta 1</h2>

Click "Próxima"

Depois: <main [ngSwitch]="1">
          <div class="pergunta-card">  (nova instância!)
              <h2>Pergunta 2</h2>
```

**Como saber que foi recriada:**
- Copie o HTML antes
- Clique próxima
- Veja se o HTML mudou (não é só valor, mas estrutura)

---

## 🎯 Teste 4: Verificar TrackBy Funcionando

**Objetivo:** Garantir que o trackBy está otimizando corretamente

**Passos:**
1. DevTools → Console
2. Cole este código:
```javascript
// Contar quantas vezes o botão 1 foi criado/destruído
let contador = 0;
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.classList && node.classList.contains('opcao-card')) {
          console.log('🆕 Botão criado:', node.textContent);
          contador++;
        }
      });
    }
  });
});

observer.observe(document.querySelector('.opcoes'), { childList: true });
console.log('✅ Observer ativado. Navegue entre perguntas e veja quantos botões foram criados.');
```

3. Navegue entre 3 perguntas
4. Veja quantos logs aparecem

**Esperado:**
```
🆕 Botão criado: Opção A
🆕 Botão criado: Opção B
... (todos os botões de pergunta 2)
🆕 Botão criado: Opção C
... (todos os botões de pergunta 3)
```

**Se funcionar corretamente:**
- TrackBy está evitando recriação desnecessária
- Botões apenas criados quando pergunta muda

---

## 🐛 Teste 5: Responsive - Testar em Diferentes Tamanhos

**Objetivo:** Garantir que funciona em qualquer tamanho de tela

**Dispositivos:**
- Desktop (1920x1080)
- Tablet (800x600)
- Mobile Portrait (375x667)
- Mobile Landscape (667x375)

**Passos:**
1. Abra DevTools → Responsive Design Mode
2. Ajuste tamanho
3. Verifique texto muda em cada tamanho

**Esperado:**
```
✅ Funciona em todos os tamanhos
✅ Texto sempre visível
✅ Opções sempre clicáveis
```

---

## 📊 Teste 6: Stress Test - Mudar Rapidamente

**Objetivo:** Validar que não há race conditions com mudanças rápidas

**Passos:**
1. Clique rapidamente "Próxima" 5 vezes
2. Observe se texto fica desincronizado com opções

**Esperado:**
```
✅ Mesmo com cliques rápidos, tudo fica sincronizado
✅ Não há "saltos" ou desincronização
```

**Se houver problema:**
- Pode haver uma race condition nas mudanças
- Seria necessário adicionar debounce

---

## 🔧 Teste 7: Voltar e Avançar - Validar Persistência

**Objetivo:** Garantir que respostas anterior permanecem marcadas

**Passos:**
1. Pergunta 1: Selecione opção "A"
2. Clique "Próxima"
3. Pergunta 2: Selecione opção "B"
4. Clique "Próxima"
5. Pergunta 3: Selecione opção "C"
6. Clique "Anterior" 2 vezes (volta para pergunta 1)

**Esperado:**
```
✅ Pergunta 1 mostra texto original
✅ Opção "A" está marcada (como havia selecionado)
✅ Navegação funciona perfeitamente
```

---

## 🌍 Teste 8: Navegadores Diferentes (Mobile)

**Objetivo:** Testar em diferentes navegadores que às vezes têm bugs

**Navegadores:**
- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile
- [ ] Safari (iOS)
- [ ] UC Browser (se tiver, muito lento)

**Passos:** Repetir testes 1-3 em cada navegador

**Esperado:**
```
✅ Funciona em todos os navegadores
```

**Navegadores Conhecidos com Problemas:**
- Samsung Internet: smooth scroll pode não funcionar (já temos fallback)
- UC Browser: muito lento (ngZone.run já trata)
- Android nativo: font-size pode ficar grande (CSS issue, não componente)

---

## 📋 Checklist de Aprovação

Marque quando testado e passou:

### Desktop
- [ ] Texto muda ao avançar
- [ ] Texto muda ao voltar
- [ ] Respostas ficam marcadas
- [ ] DevTools mostra recriação do elemento

### Mobile (Android)
- [ ] Texto muda ao avançar (CRÍTICO - era o bug original)
- [ ] Texto muda ao voltar
- [ ] Respostas ficam marcadas
- [ ] Sem lag ou delay

### Mobile (iOS)
- [ ] Funciona normalmente
- [ ] Sem problemas específicos do Safari

### Múltiplos Navegadores
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Samsung Internet ✅
- [ ] Safari ✅

---

## 📝 Se Encontrar Problema

### Problema: Texto ainda não muda
**Solução:** 
1. Verifique que usou ngSwitch corretamente
2. Verifique que perguntaAtual?.id está correto
3. Adicione console.log no componente:
```typescript
console.log('🔄 Pergunta mudou para:', this.indiceAtual, this.perguntaAtual?.texto);
```

### Problema: Texto muda muito lento
**Solução:**
1. Reduza mais a animação (já está em 150ms)
2. Remova will-change se estiver muito pesado
3. Adicione `ChangeDetectionStrategy.OnPush`

### Problema: Opções não mudaram também
**Solução:**
1. Verifique que *ngSwitchDefault está envolvendo tudo
2. Verifique que trackBy está sendo usado
3. Adicione console.log na função `proxima()`

---

## 🎉 Sucesso!

Quando todos os testes passarem:
✅ Component está funcionando perfeitamente  
✅ Pronto para produção  
✅ Bug de renderização em mobile RESOLVIDO  

