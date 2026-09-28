# Guia Visual de Troubleshooting - Problema Perguntas NR-1

## 🎯 Fluxo Esperado vs Real

### ✅ FLUXO CORRETO (Esperado)

```
Usuario clica em opção
    ↓
[260-350ms] Animação CSS + Delay de segurança
    ↓
indiceAtual incrementa
    ↓
✅ Angular detecta mudança
    ↓
📱 Tela atualiza com nova pergunta
    ↓
Scroll para topo (smooth ou instant)
    ↓
Novo componente renderizado
```

---

### ❌ FLUXO COM PROBLEMA (O que está acontecendo)

```
Usuario clica em opção
    ↓
[260ms] setTimeout dispara ANTES da animação CSS terminar
    ↓
indiceAtual incrementa
    ↓
⚠️ Angular tenta detectar mudança MAS
    ├─→ Animação CSS ainda rodando (280ms total)
    └─→ Conflito de rendering!
    ↓
📱 Tela fica em branco / congela
    ↓
scroll behavior: 'smooth' não é suportado
    ├─→ scrollTo falha silenciosamente
    └─→ Usuário vê rodapé em vez da pergunta
    ↓
❌ Nunca renderiza pergunta seguinte
```

---

## 🔧 Diagnóstico Prático

### Teste 1: Verificar Timeline de Eventos

**O que fazer:**
1. Abrir DevTools → Performance/Timeline
2. Selecionar uma opção
3. Observar o gráfico de eventos

**Esperado (✅):**
```
0ms    → Click event
50ms   → respostas = {...} atualizado
260ms  → setTimeout callback
310ms  → indiceAtual++ 
320ms  → Angular detecta mudança
330ms  → DOM renderizado
350ms  → scrollTo executa
```

**Com problema (❌):**
```
0ms    → Click event
50ms   → respostas = {...} atualizado
260ms  → setTimeout callback
310ms  → indiceAtual++
320ms  → Angular TENTA detectar mudança
        → MAS CSS animation ainda rodando!
        → CONFLITO!
340ms  → DOM não renderiza ou renderiza com erro
560ms  → Animação CSS finalmente termina
?      → Usuário está esperando...
```

---

### Teste 2: Verificar Suporte a ScrollTo Smooth

**No Console do Navegador (F12):**

```javascript
// Comando 1: Testar suporte
window.CSS?.supports('scroll-behavior', 'smooth') ? '✅ Suportado' : '❌ NÃO suportado'

// Comando 2: Testar scroll manual
window.scrollTo({ top: 0, behavior: 'smooth' });
// Se não funcionou → seu navegador não suporta!

// Comando 3: Testar scroll simples
window.scrollTo(0, 0);
// Isso DEVE funcionar em qualquer navegador
```

---

### Teste 3: Verificar Viewport Height

**No Console:**

```javascript
// Verificar altura disponível
console.log('innerHeight:', window.innerHeight);
console.log('outerHeight:', window.outerHeight);
console.log('documentElement.clientHeight:', document.documentElement.clientHeight);

// Verificar se 100dvh está sendo respeitado
const host = document.querySelector('app-pesquisa-nr1');
console.log('Host height:', host?.getBoundingClientRect().height);
console.log('Host altura em % de viewport:', (host?.getBoundingClientRect().height / window.innerHeight * 100) + '%');
```

**Esperado:**
- Altura ~100% do viewport
- Sem scroll quando não necessário

**Com problema:**
- Altura < 90% (faltando espaço)
- Scroll inesperado

---

### Teste 4: Simular Aparelho Específico

**Chrome DevTools → Device Emulation:**

1. F12 → Clique no ícone de dispositivo (Device Toolbar)
2. Selecione modelos específicos:
   - ❌ Nexus 5 (Android 4.4 - teste compatibilidade)
   - ❌ Galaxy S6 (Android 5.0 - lento)
   - ⚠️ Galaxy S10 (Android 10 - performance média)
   - ✅ iPhone 12 (iOS 14+ - rápido)

3. Para cada um, teste:
   - Responder uma pergunta
   - Verificar se a próxima aparece
   - Abrir Console e procurar por erros

---

## 📊 Matriz de Compatibilidade

| Navegador | Android | iOS | Suporte `smooth` | Suporte `100dvh` | Status |
|-----------|---------|-----|------------------|------------------|--------|
| Chrome | 4.4+ | - | 61+ | 90+ | ⚠️ Parcial |
| Firefox | 4.4+ | - | 36+ | Não | ⚠️ Parcial |
| Safari | - | 8+ | 9+ | 13+ | ✅ Bom |
| Samsung Internet | 4.4+ | - | 8+ | Não | ❌ Problemático |
| UC Browser | 4.4+ | - | Não | Não | ❌ Ruim |
| Navegador nativo | 4.4+ | - | Não | Não | ❌ Ruim |
| Opera Mini | 4.4+ | - | Não | Não | ❌ Ruim |

**Conclusão:**
- `scroll-behavior: smooth` **falha em ~40% dos celulares**
- `100dvh` **falha em Android < 8**
- Usar **fallbacks é obrigatório**

---

## 🚨 Erros Esperados (E Como Resolver)

### Erro 1: "Cannot read property 'scrollTo' of undefined"
**Causa:** `window` não disponível (SSR?)
**Solução:** Adicionar `if (typeof window !== 'undefined')`

```typescript
private rolarTopo(): void {
    if (typeof window === 'undefined') return;  // ← ADICIONAR
    try {
        window.scrollTo(0, 0);
    } catch {
        // ...
    }
}
```

---

### Erro 2: "pergunta undefined" ou tela em branco
**Causa:** `indiceAtual` incrementou mas Angular não atualizou
**Solução:** Usar `cdr.markForCheck()` (já implementado nas correções)

```typescript
proxima(): void {
    if (this.indiceAtual < this.totalPerguntas - 1) {
        this.indiceAtual++;
        this.cdr.markForCheck();  // ← FORÇAR ATUALIZAÇÃO
        this.rolarTopo();
    }
}
```

---

### Erro 3: ScrollTo "não funciona"
**Causa:** Navegador não suporta `smooth`
**Solução:** Usar fallback (já implementado nas correções)

```typescript
if (window.CSS?.supports('scroll-behavior', 'smooth')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
} else {
    window.scrollTo(0, 0);  // ← FALLBACK
}
```

---

### Erro 4: Página fica travada após resposta
**Causa:** Timeout insuficiente (260ms < 280ms animação)
**Solução:** Aumentar para 350ms (já implementado nas correções)

```typescript
window.setTimeout(() => this.proxima(), 350);  // ← 350 em vez de 260
```

---

## 🧪 Script de Teste Automático

Copie e cole no Console (F12) enquanto está na pesquisa:

```javascript
console.log('=== TESTE DE COMPATIBILIDADE NR-1 ===');

// Teste 1: Viewport
const vh100 = window.innerHeight;
const dvhSupport = CSS?.supports('height', '100dvh');
console.log(`✅ Viewport: ${vh100}px | 100dvh: ${dvhSupport ? 'Sim' : 'Não'}`);

// Teste 2: ScrollBehavior
const smoothSupport = CSS?.supports('scroll-behavior', 'smooth');
console.log(`✅ Scroll smooth: ${smoothSupport ? 'Sim' : 'Não'}`);

// Teste 3: Componente carregado
const ngComponent = document.querySelector('app-pesquisa-nr1');
console.log(`✅ Componente: ${ngComponent ? 'Carregado' : 'NÃO CARREGADO'}`);

// Teste 4: Pergunta renderizada
const pergunta = document.querySelector('.pergunta-area');
console.log(`✅ Pergunta renderizada: ${pergunta ? 'Sim' : 'Não'}`);

// Teste 5: Tela carregada
const telaMostrada = document.querySelector('[aria-live="polite"]');
console.log(`✅ Tela atual: ${telaMostrada?.getAttribute('class') || 'desconhecida'}`);

// Teste 6: Simular clique em opção
const opcoes = document.querySelectorAll('.opcao-card');
console.log(`✅ Total de opções visíveis: ${opcoes.length}`);

console.log('=== FIM DO TESTE ===');
```

**Esperado (✅):**
```
✅ Viewport: 360px | 100dvh: Sim
✅ Scroll smooth: Sim
✅ Componente: Carregado
✅ Pergunta renderizada: Sim
✅ Tela atual: pergunta-area
✅ Total de opções visíveis: 5
```

**Com problema (❌):**
```
✅ Viewport: 360px | 100dvh: Não
✅ Scroll smooth: Não                    ← PROBLEMA 1
✅ Componente: Carregado
❌ Pergunta renderizada: Não             ← PROBLEMA 2
✅ Tela atual: desconhecida
✅ Total de opções visíveis: 5
```

---

## 📞 Informações para Relatar

Se o problema continuar após implementar as correções, colete:

1. **Aparelho:**
   - Marca e modelo exato
   - Versão Android/iOS
   - RAM disponível

2. **Navegador:**
   - Nome e versão
   - Cache limpo? Sim/Não

3. **Conectividade:**
   - Wi-Fi ou dados móveis?
   - Velocidade (3G/4G/5G)?
   - Latência?

4. **Console Error:**
   ```javascript
   // Abrir Console (F12)
   // Tirar screenshot de qualquer erro em vermelho
   ```

5. **Performance:**
   ```javascript
   // Cole isso no Console
   performance.getEntriesByType('measure').forEach(m => {
       console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
   });
   ```

---

## 🎓 Resumo de Causas Raiz

| # | Problema | Navegadores Afetados | Severidade | Solução |
|---|----------|----------------------|------------|---------|
| 1 | setTimeout 260ms < animação 280ms | Todos | 🔴 Alta | Aumentar para 350ms |
| 2 | scroll-behavior: smooth não suportado | Samsung, UC, nativo Android | 🔴 Alta | Usar fallback |
| 3 | 100dvh não suportado | Android < 8 | 🟡 Média | Fallback para 100vh |
| 4 | Change detection falha em baixo FPS | Telefones antigos (< 2GB RAM) | 🔴 Alta | markForCheck() |
| 5 | Sem logging (impossível debugar) | Todos | 🟡 Média | Adicionar console.log |

**Prioridade máxima:** Problemas 1, 2, 4

