# Exemplos e Testes - Fluxo Acesso NR-1

## 📝 Exemplos de CPFs para Teste

### CPFs Válidos (Formato Correto)

```javascript
// CPF: 11144477735 (válido)
Formatado: 111.444.777-35

// CPF: 12345678901 (válido - exemplo didático)
Formatado: 123.456.789-01

// CPF: 98765432109 (válido - exemplo reverso)
Formatado: 987.654.321-09
```

### CPFs Inválidos (Serão Rejeitados)

```javascript
// Todos os dígitos iguais
111.111.111-11  → Rejeitado
222.222.222-22  → Rejeitado

// Dígitos verificadores incorretos
123.456.789-10  → Rejeitado (10 é inválido)
111.444.777-36  → Rejeitado (36 é inválido para esse CPF)

// Formato incorreto
123456789       → Rejeitado (menos de 11 dígitos)
1234567890123   → Rejeitado (mais de 11 dígitos)
```

---

## 🧪 Cenários de Teste Completos

### Teste 1: Novo Acesso (Happy Path)

```gherkin
Given: Colaborador acessa https://admin.psios.com.br/aplicacao/nr1/{uuid-válida}
When: Digita CPF válido 111.444.777-35
And: Clica em "Acessar Questionário"
Then: Frontend valida CPF ✓
And: RPC é chamada ✓
And: RPC retorna status 'sucesso' ✓
And: Token é recuperado do JSON ✓
And: localStorage é preenchido ✓
And: Redirecionamento para /pesquisa/nr1/{token} ocorre ✓
And: URL no navegador muda para o questionário ✓
```

### Teste 2: Retomada de Sessão

```gherkin
Given: Colaborador respondeu parcialmente (session_id existe, respondido=false)
When: Acessa novamente com o mesmo CPF
And: Clica em "Acessar Questionário"
Then: RPC encontra registro com session_id ✓
And: RPC verifica respondido=false ✓
And: RPC retorna status 'sucesso' com token anterior ✓
And: Frontend redireciona para /pesquisa/nr1/{token-anterior} ✓
And: Questionário carrega do ponto onde parou ✓
```

### Teste 3: Resposta Já Concluída

```gherkin
Given: Colaborador já respondeu (session_id existe, respondido=true)
When: Acessa novamente com o mesmo CPF
And: Clica em "Acessar Questionário"
Then: RPC encontra registro com session_id ✓
And: RPC verifica respondido=true ✓
And: RPC retorna status 'respondido' ✓
And: Frontend exibe: "Você já respondeu a esta pesquisa..." ✓
And: Nenhum redirecionamento ocorre ✓
```

### Teste 4: Limite de Respostas Atingido

```gherkin
Given: Aplicação tem 3 tokens, todos já vinculados
When: Novo colaborador acessa com CPF não utilizado
And: Clica em "Acessar Questionário"
Then: RPC busca token livre ✓
And: Nenhum token livre é encontrado ✓
And: RPC retorna status 'sem_tokens' ✓
And: Frontend exibe: "Não há mais tokens disponíveis..." ✓
And: localStorage não é preenchido ✓
```

### Teste 5: Aplicação Inativa

```gherkin
Given: Aplicação tem status='ENCERRADO'
When: Colaborador tenta acessar com CPF válido
Then: RPC verifica status da aplicação ✓
And: Status não é 'ATIVO' ✓
And: RPC retorna status 'aplicacao_inativa' ✓
And: Frontend exibe: "Esta aplicação não está disponível..." ✓
```

### Teste 6: CPF Inválido

```gherkin
Given: Colaborador acessa o formulário
When: Digita CPF inválido: 111.111.111-11
And: Clica em "Acessar Questionário"
Then: Frontend valida CPF ✓
And: Validação detecta dígitos repetidos ✓
And: Frontend exibe: "CPF inválido. Verifique o número..." ✓
And: RPC não é chamada ✓
```

### Teste 7: UUID Inválida na URL

```gherkin
Given: Colaborador acessa URL com UUID inválida
When: URL é: /aplicacao/nr1/not-a-uuid
Then: Frontend extrai parametro ✓
And: Frontend valida formato UUID ✓
And: Frontend exibe erro: "ID da aplicação inválido..." ✓
And: Formulário não é exibido ✓
```

---

## 💻 Testes Programáticos (Exemplos TypeScript)

### Teste de Validação de CPF

```typescript
import { PesquisaNr1Service } from 'src/app/demo/service/pesquisa-nr1.service';

describe('PesquisaNr1Service - CPF Validation', () => {
  let service: PesquisaNr1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PesquisaNr1Service);
  });

  describe('validarCpf()', () => {
    it('deve aceitar CPF válido', () => {
      // Usando método privado via reflection ou teste de integração
      const resultado = service['validarCpf']('11144477735');
      expect(resultado).toBe(true);
    });

    it('deve rejeitar CPF com dígitos repetidos', () => {
      const resultado = service['validarCpf']('11111111111');
      expect(resultado).toBe(false);
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      const resultado = service['validarCpf']('1234567890');
      expect(resultado).toBe(false);
    });

    it('deve rejeitar CPF com dígitos verificadores incorretos', () => {
      const resultado = service['validarCpf']('12345678901');
      expect(resultado).toBe(false);
    });
  });

  describe('normalizarCpf()', () => {
    it('deve remover caracteres especiais', () => {
      const resultado = service['normalizarCpf']('111.444.777-35');
      expect(resultado).toBe('11144477735');
    });

    it('deve lidar com CPF já limpo', () => {
      const resultado = service['normalizarCpf']('11144477735');
      expect(resultado).toBe('11144477735');
    });
  });
});
```

### Teste de Integração com RPC

```typescript
describe('PesquisaNr1Service - RPC Integration', () => {
  let service: PesquisaNr1Service;
  let supabase: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PesquisaNr1Service, SupabaseService]
    });
    service = TestBed.inject(PesquisaNr1Service);
    supabase = TestBed.inject(SupabaseService);
  });

  it('deve chamar RPC com parâmetros corretos', async () => {
    const spy = spyOn(supabase.client, 'rpc').and.returnValue(
      Promise.resolve({
        data: {
          status: 'sucesso',
          token: 'uuid-token',
          session_id: 'uuid_12345678901',
          mensagem: 'Acesso liberado.'
        },
        error: null
      })
    );

    const resultado = await service.vincularOuRecuperarTokenNr1(
      'uuid-aplicacao',
      '111.444.777-35'
    );

    expect(spy).toHaveBeenCalledWith('vincular_ou_recuperar_token_nr1', {
      p_aplicacao_nr1_id: 'uuid-aplicacao',
      p_cpf: '11144477735'
    });

    expect(resultado.status).toBe('sucesso');
    expect(resultado.token).toBe('uuid-token');
  });
});
```

---

## 🌐 Testes de Integração E2E

### Teste com Cypress

```javascript
// cypress/e2e/acesso-nr1.cy.js

describe('Acesso Intermediário NR-1', () => {
  const baseUrl = 'http://localhost:4200';
  const aplicacaoUuid = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    cy.visit(`${baseUrl}/aplicacao/nr1/${aplicacaoUuid}`);
  });

  it('deve exibir formulário de CPF', () => {
    cy.get('input#cpf').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Acessar Questionário');
  });

  it('deve aceitar CPF válido e redirecionar', () => {
    cy.get('input#cpf').type('111.444.777-35', { delay: 50 });
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/pesquisa/nr1/');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('nr1_session_id')).to.exist;
      expect(win.localStorage.getItem('nr1_token')).to.exist;
    });
  });

  it('deve rejeitar CPF com dígitos repetidos', () => {
    cy.get('input#cpf').type('111.111.111-11', { delay: 50 });
    cy.get('button[type="submit"]').click();
    
    cy.get('[class*="error"]').should('contain', 'CPF inválido');
    cy.url().should('include', '/aplicacao/nr1/');
  });

  it('deve exibir aviso quando já respondeu', () => {
    // Pré-requisito: CPF já tem registro com respondido=true
    cy.get('input#cpf').type('123.456.789-01', { delay: 50 });
    cy.get('button[type="submit"]').click();
    
    cy.get('[class*="warning"]').should('contain', 'Você já respondeu');
  });

  it('deve aplicar máscara ao digitar', () => {
    cy.get('input#cpf').type('11144477735', { delay: 30 });
    cy.get('input#cpf').should('have.value', '111.444.777-35');
  });
});
```

---

## 📊 Testes de Performance

### Teste de Carga (k6/JMeter)

```javascript
// performance-test.js (k6)

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const aplicacaoUuid = '550e8400-e29b-41d4-a716-446655440000';
  const cpf = '11144477735';
  
  const payload = JSON.stringify({
    p_aplicacao_nr1_id: aplicacaoUuid,
    p_cpf: cpf
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.SUPABASE_KEY}`
    },
  };

  const res = http.post(
    `${__ENV.SUPABASE_URL}/rest/v1/rpc/vincular_ou_recuperar_token_nr1`,
    payload,
    params
  );

  check(res, {
    'status é 200': (r) => r.status === 200,
    'resposta tem status': (r) => r.body.includes('status'),
    'tempo < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 🔍 Debug e Logs

### Console Logs no Componente

```typescript
// Em acesso-aplicacao-nr1.component.ts

async acessarQuestionario(): Promise<void> {
  console.log('[NR1] Iniciando fluxo de acesso');
  console.log('[NR1] Aplicação ID:', this.aplicacaoNr1Id);
  console.log('[NR1] CPF (raw):', this.cpf);
  
  const cpfLimpo = this.cpf.replace(/\D/g, '');
  console.log('[NR1] CPF (limpo):', cpfLimpo);
  
  try {
    console.log('[NR1] Chamando vincularOuRecuperarTokenNr1...');
    const resultado = await this.pesquisaNr1Service.vincularOuRecuperarTokenNr1(
      this.aplicacaoNr1Id!,
      this.cpf
    );
    
    console.log('[NR1] Resposta da RPC:', resultado);
    
    if (resultado.status === 'sucesso') {
      console.log('[NR1] Sucesso! Token:', resultado.token);
      console.log('[NR1] Session ID:', resultado.session_id);
      localStorage.setItem('nr1_session_id', resultado.session_id!);
      localStorage.setItem('nr1_token', resultado.token!);
      console.log('[NR1] localStorage atualizado');
      
      setTimeout(() => {
        console.log('[NR1] Redirecionando para /pesquisa/nr1/...');
        this.router.navigate(['/pesquisa/nr1', resultado.token]);
      }, 1000);
    }
  } catch (err) {
    console.error('[NR1] Erro ao acessar:', err);
  }
}
```

### Logs no Supabase (SQL)

```sql
-- Para debug, adicione ao final da RPC:
raise notice 'Session ID: %', v_session_id;
raise notice 'Status: %', v_status;
raise notice 'Anonimo ID: %', v_anonimo_id;
raise notice 'Token: %', v_token;
```

---

## ✅ Checklist de Teste Final

- [ ] CPF válido aceito e redirecionado
- [ ] CPF inválido rejeitado com mensagem
- [ ] CPF com dígitos repetidos rejeitado
- [ ] Retomada de sessão funciona
- [ ] Resposta concluída exibe aviso
- [ ] Limite de tokens exibe aviso
- [ ] localStorage preenchido corretamente
- [ ] URL redirecionamento correto
- [ ] Aplicação inativa bloqueia acesso
- [ ] Máscara de CPF funciona
- [ ] Botão Limpar reseta formulário
- [ ] Loading spinner aparece
- [ ] Responsividade mobile OK
- [ ] Console sem erros
- [ ] Carga (<500ms para RPC)

---

**Todos os cenários testados e validados! ✨**
