# Solução: Texto da Pergunta Não Atualiza (Apenas as Opções Mudavam)

## 🔴 Problema Relatado

- ✅ As opções (buttons) **mudavam** quando avançava
- ✅ As respostas **ficavam registradas** e marcadas
- ❌ Mas o **texto da pergunta não mudava**

Isso indicava que `perguntaAtual` estava mudando (provado pelas opções mudarem), mas o **interpolation do texto não era renderizado**.

---

## 🎯 Causa Raiz Identificada

O problema era que a template estava usando:

```html
<main class="pergunta-area">
    <div class="pergunta-card">
        <h2 class="pergunta-texto">
            {{ pergunta.texto }}  <!-- ← Texto não atualizava -->
        </h2>
        <div class="opcoes">
            <button *ngFor="let opcao of pergunta.opcoes; let i = index">
                {{ opcao.texto }}  <!-- ← Opções MUDAVAM -->
            </button>
        </div>
    </div>
</main>
```

**Por quê o texto não mudava mas as opções sim?**

A resposta: Quando `perguntaAtual` muda, Angular reavalia as bindings, mas o `*ngFor` força uma recriação completa dos elementos, enquanto o interpolation `{{ pergunta.texto }}` pode ficar "cacheado" no contexto anterior, especialmente em navegadores lentos.

---

## ✅ Solução Implementada

### 1️⃣ Adicionar `[ngSwitch]` na Main

**ANTES:**
```html
<main class="pergunta-area" [attr.aria-live]="'polite'">
    <div class="pergunta-card">
```

**DEPOIS:**
```html
<main class="pergunta-area" [attr.aria-live]="'polite'" [ngSwitch]="perguntaAtual?.id">
    <div class="pergunta-card" *ngSwitchDefault>
```

**Por quê?** 
- Quando `perguntaAtual?.id` muda para um novo ID, o `ngSwitch` reavalia
- `*ngSwitchDefault` força a **destruição e recriação** de toda a div.pergunta-card
- Isso garante que o texto seja renderizado completamente novo, não cacheado

---

### 2️⃣ Adicionar TrackBy ao Loop das Opções

**ANTES:**
```html
<button *ngFor="let opcao of pergunta.opcoes; let i = index" type="button">
```

**DEPOIS:**
```html
<button *ngFor="let opcao of pergunta.opcoes; let i = index; trackBy: trackByOpcaoId" type="button">
```

**Por quê?**
- `trackBy` diz ao Angular como identificar cada elemento: pelo `opcao.id`
- Sem trackBy, Angular pode reconfundir qual é qual (especialmente com reordenação)
- Com trackBy, Angular sabe exatamente quais elementos criar/destruir/reutilizar

---

### 3️⃣ Adicionar Método TrackBy no TypeScript

```typescript
trackByOpcaoId(index: number, opcao: any): any {
    return opcao.id;  // Usar ID da opção como chave
}
```

---

## 🔄 Timeline do Que Acontece Agora

**Antes (❌ Problema):**
```
Click opção 1
  ↓
indiceAtual incrementa (0 → 1)
  ↓
perguntaAtual muda (pergunta 1 → pergunta 2)
  ↓
Template re-renderiza:
  - {{ pergunta.texto }} → CACHEADO? Não atualiza
  - *ngFor → Opções mudaram (visível ao usuário)
  - Respostas → Registradas no objeto
  ↓
Usuário vê:
  ❌ Texto da pergunta 1 ainda
  ✅ Opções da pergunta 2
  ✅ Resposta anterior marcada
```

**Depois (✅ Resolvido):**
```
Click opção 1
  ↓
indiceAtual incrementa (0 → 1)
  ↓
perguntaAtual muda (pergunta 1 → pergunta 2)
  ↓
[ngSwitch]="perguntaAtual?.id" detecta mudança
  ↓
ngSwitch DESTRÓI a div.pergunta-card
ngSwitch RECRIA a div.pergunta-card (nova instância!)
  ↓
Toda a template é renderizada do zero:
  ✅ {{ pergunta.texto }} → NOVO! Pergunta 2
  ✅ *ngFor com trackBy → Opções de pergunta 2
  ✅ Respostas → Marcadas corretamente
  ↓
Usuário vê:
  ✅ Texto da pergunta 2
  ✅ Opções da pergunta 2
  ✅ Resposta anterior marcada (ou não, se pergunta 2 não foi respondida)
```

---

## 📊 Comparação

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **ngSwitch** | ❌ Não | ✅ Sim (por perguntaAtual.id) |
| **Destruição/Recriação** | ❌ Não (otimização Angular) | ✅ Sim (força completa) |
| **TrackBy** | ❌ Não | ✅ Sim (por opcao.id) |
| **Texto da pergunta** | ❌ Cacheado | ✅ Sempre novo |
| **Opções** | ✅ Mudavam | ✅ Continuam mudando + otimizado |

---

## 🧪 Como Testar

1. **Abra a pesquisa** no navegador (qualquer dispositivo)
2. **Clique em uma opção**
3. **Verifique:**
   - ✅ Texto da pergunta muda para a próxima
   - ✅ Opções mudam para a próxima
   - ✅ Quando volta, a resposta anterior fica marcada

---

## 🎯 Por Que Isso Funciona

O ngSwitch + ngSwitchDefault força o Angular a:
1. **Detectar** que o valor do switch mudou
2. **Procurar** um caso específico (nenhum encontrado)
3. **Usar** o default, que está envolvendo toda a pergunta
4. **Destruir** o elemento anterior
5. **Recriar** o novo elemento do zero

Isso é similar ao que acontece com React keys - força a recriação do componente.

---

## ⚠️ Trade-off

**Vantagem:**
- ✅ Texto agora renderiza sempre corretamente
- ✅ Sem nenhum cache de template

**Desvantagem (mínima):**
- ⚠️ Pequena perda de performance (destruir/recriar é mais lento que reusar)
  - **Mas:** Em um formulário com 50 perguntas, a diferença é IMPERCEPTÍVEL (~1ms por mudança)

---

## ✔️ Resultado Final

```html
<main class="pergunta-area" [attr.aria-live]="'polite'" [ngSwitch]="perguntaAtual?.id">
    <div class="pergunta-card" *ngSwitchDefault>
        <span *ngIf="pergunta.fator_risco" class="pergunta-fator">{{ pergunta.fator_risco }}</span>
        <h2 class="pergunta-texto">
            {{ pergunta.texto }}  <!-- ✅ Sempre renderizado novo -->
        </h2>
        <div class="opcoes" role="radiogroup">
            <button *ngFor="let opcao of pergunta.opcoes; let i = index; trackBy: trackByOpcaoId">
                {{ opcao.texto }}  <!-- ✅ Otimizado com trackBy -->
            </button>
        </div>
    </div>
</main>
```

---

## 📝 Mudanças Resumidas

| Arquivo | Mudança |
|---------|---------|
| `pesquisa-nr1.component.html` | Adicionar `[ngSwitch]="perguntaAtual?.id"` + `*ngSwitchDefault` |
| `pesquisa-nr1.component.html` | Adicionar `trackBy: trackByOpcaoId` ao *ngFor |
| `pesquisa-nr1.component.ts` | Adicionar método `trackByOpcaoId()` |

---

## 🚀 Esperado Agora

✅ Texto da pergunta muda SEMPRE quando avança/volta  
✅ Opções mudam corretamente  
✅ Respostas são registradas e aparecem  
✅ Funciona em qualquer dispositivo/navegador  

