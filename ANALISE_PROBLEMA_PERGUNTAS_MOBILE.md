# Análise: Problema de Exibição da Próxima Pergunta no Mobile

## 🔴 Problema Relatado
Em determinados aparelhos celulares, ao responder uma pergunta no formulário `/pesquisa/nr1/{token}`:
- ✅ Barra de progresso avança corretamente
- ❌ Próxima pergunta **NÃO aparece** (tela fica em branco ou congela)
- O componente não renderiza a pergunta seguinte

---

## 🎯 Causa Raiz Identificada

### **1. PROBLEMA PRINCIPAL: Timing Insuficiente entre Animação CSS e Navegação JavaScript**

**Localização**: [pesquisa-nr1.component.ts](pesquisa-nr1.component.ts#L185-L199)

```typescript
selecionarOpcao(perguntaId: string, opcaoId: string): void {
    this.respostas = { ...this.respostas, [perguntaId]: opcaoId };
    
    if (!this.ehUltima) {
        window.setTimeout(() => this.proxima(), 260);  // ⚠️ 260ms
    }
}
```

**O Problema:**
- O setTimeout **260ms** conflita com a animação CSS **280ms**
- Animação: `.pergunta-area { animation: entrar .28s ease; }`
- Resultado: A animação de entrada **não termina** antes da mudança de índice
- Em dispositivos lentos: a animação pode levar **300ms+**, causando conflito

---

### **2. PROBLEMA SECUNDÁRIO: ScrollTo com 'smooth' em Mobile**

**Localização**: [pesquisa-nr1.component.ts](pesquisa-nr1.component.ts#L212-L218)

```typescript
private rolarTopo(): void {
    try {
        window.scrollTo({ top: 0, behavior: 'smooth' });  // ⚠️ Não funciona em todos os navegadores mobile
    } catch {
        window.scrollTo(0, 0);
    }
}
```

**Problema:**
- `behavior: 'smooth'` não é suportado em navegadores mobile antigos ou em WebView de certos aparelhos
- Alguns navegadores (Samsung Internet, navegadores de marca própria) ignoram ou falham silenciosamente
- A falta de scroll para o topo deixa o usuário vendo o rodapé/botões, não a pergunta

---

### **3. PROBLEMA TERCIÁRIO: Viewport Height Dinâmico (100dvh)**

**Localização**: [pesquisa-nr1.component.scss](pesquisa-nr1.component.scss#L5)

```scss
:host {
    display: block; min-height: 100dvh;  /* ⚠️ Dynamic viewport height */
}
```

**Problema:**
- `100dvh` não é suportado em navegadores Android mais antigos (< Android 7)
- Alguns emuladores e navegadores antigos usam `100vh` que muda com barra de endereço
- Resultado: componente pode não ocupar altura correta, causando problemas de layout

---

### **4. PROBLEMA: Detecção de Mudanças Angular (Change Detection)**

**Localização**: Componente não configura `ChangeDetectionStrategy.OnPush`

```typescript
@Component({
    selector: 'app-pesquisa-nr1',
    templateUrl: './pesquisa-nr1.component.html',
    styleUrl: './pesquisa-nr1.component.scss'
    // ⚠️ Falta ChangeDetectionStrategy.OnPush explícita
})
```

**Problema:**
- Em dispositivos com baixa performance ou quando o navegador está ocupado, a detecção padrão pode atrasar
- A atualização de `indiceAtual` pode não disparar o re-render imediatamente
- Em alguns celulares (especialmente Android com 2GB RAM), isso causa travamento aparente

---

### **5. PROBLEMA: Falta de Validação de Scroll**

Não há garantia de que o scroll foi bem-sucedido. Se falhar silenciosamente:
- Usuário não vê a pergunta nova
- Pensa que está travado
- Pode recarregar a página (perdendo estado)

---

## 📋 Checklist de Diagnóstico

Teste isso no celular com problema:

```javascript
// Abra DevTools (F12) e rode no console:

// 1. Verificar suporte a 'smooth'
console.log('Suporte smooth:', window.CSS?.supports('scroll-behavior', 'smooth'));

// 2. Verificar viewport height
console.log('VH disponível:', window.innerHeight);
console.log('DVH seria (app.getBoundingClientRect):', document.querySelector('app-pesquisa-nr1')?.getBoundingClientRect().height);

// 3. Verificar se Angular está detectando mudanças
console.log('Change Detection funciona:', document.querySelector('.pergunta-area')?.textContent);

// 4. Testar scroll manualmente
window.scrollTo(0, 0);
```

---

## ✅ Soluções Recomendadas

### **Solução 1: Aumentar Timeout e Sincronizar com Animação** (RÁPIDO)
```typescript
if (!this.ehUltima) {
    // Aguardar mais que a animação CSS (280ms)
    window.setTimeout(() => this.proxima(), 350);  // ✅ 350ms > 280ms + margem
}
```

### **Solução 2: Usar requestAnimationFrame em vez de setTimeout** (MELHOR)
```typescript
if (!this.ehUltima) {
    requestAnimationFrame(() => {
        setTimeout(() => this.proxima(), 300);
    });
}
```

### **Solução 3: Remover 'smooth' do ScrollTo** (URGENTE)
```typescript
private rolarTopo(): void {
    try {
        // Tentar smooth primeiro (navegadores modernos)
        if (window.CSS?.supports('scroll-behavior', 'smooth')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Fallback para celulares antigos
            window.scrollTo(0, 0);
        }
    } catch {
        window.scrollTo(0, 0);
    }
}
```

### **Solução 4: Usar Height Fixo em vez de DVH** (COMPATIBILIDADE)
```scss
:host {
    display: block;
    min-height: 100vh; /* ✅ Suporte universal */
    min-height: 100dvh; /* ✅ Fallback para navegadores modernos */
}
```

### **Solução 5: Forçar Change Detection Explícito** (SEGURANÇA)
```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(
    private readonly route: ActivatedRoute,
    private readonly pesquisaService: PesquisaNr1Service,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef  // ✅ Adicionar
) {}

proxima(): void {
    if (this.indiceAtual < this.totalPerguntas - 1) {
        this.indiceAtual++;
        this.cdr.markForCheck();  // ✅ Forçar detecção
        this.rolarTopo();
    }
}
```

### **Solução 6: Adicionar Logging para Debug** (DIAGNÓSTICO)
```typescript
selecionarOpcao(perguntaId: string, opcaoId: string): void {
    this.respostas = { ...this.respostas, [perguntaId]: opcaoId };
    
    console.log('📝 Resposta selecionada:', perguntaId, opcaoId);
    console.log('📊 Índice atual:', this.indiceAtual, 'Total:', this.totalPerguntas);
    
    if (!this.ehUltima) {
        window.setTimeout(() => {
            console.log('➡️ Avançando para próxima pergunta...');
            this.proxima();
        }, 350);
    }
}
```

---

## 🔍 Investigação Adicional Necessária

Se as soluções acima não resolverem, investigue:

1. **Que aparelho/navegador exatamente?**
   - Modelo (Samsung, Xiaomi, etc.)
   - Versão Android (4.4, 6.0, 7.0, etc.)
   - Navegador (Chrome, Safari, Samsung Internet)
   - RAM disponível

2. **Reproduzir com DevTools:**
   - Abrir em computador com Chrome DevTools → Device Emulation
   - Testar com throttling de CPU/Network
   - Verificar console para erros

3. **Verificar se é Cache:**
   - Limpar cache do navegador
   - Testar em navegação privada/anônima
   - Verificar Service Worker (se houver)

4. **Verificar Network:**
   - É lento? Timeout de requisição?
   - Perguntas carregam lentamente via API?

---

## 🛠️ Implementação Prioritária

### Prioridade 1 (Faça Hoje):
- [ ] Aumentar setTimeout de 260ms para 350ms
- [ ] Remover `behavior: 'smooth'` do scrollTo

### Prioridade 2 (Faça Esta Semana):
- [ ] Adicionar Change Detection explícito com `markForCheck()`
- [ ] Adicionar logging para capturar problema em produção

### Prioridade 3 (Melhorias):
- [ ] Usar `requestAnimationFrame` em vez de `setTimeout`
- [ ] Implementar double-height fallback para viewport
- [ ] Adicionar error tracking (Sentry/LogRocket)

---

## 📝 Nota Importante

Este é um **problema clássico de timing em navegadores mobile**:
- A animação CSS leva tempo
- O JavaScript muda o DOM enquanto a animação roda
- Navegadores de baixo poder não conseguem renderizar ambos simultaneamente
- Resultado: tela em branco, aparente congelamento

A solução é **aumentar o timing de segurança** e **remover recursos que não funcionam em mobile antigo**.

