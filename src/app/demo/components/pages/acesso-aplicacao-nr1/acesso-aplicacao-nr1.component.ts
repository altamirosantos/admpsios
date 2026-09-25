import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PesquisaNr1Service } from 'src/app/demo/service/pesquisa-nr1.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-acesso-aplicacao-nr1',
  templateUrl: './acesso-aplicacao-nr1.component.html',
  styleUrls: ['./acesso-aplicacao-nr1.component.scss']
})
export class AcessoAplicacaoNr1Component implements OnInit, OnDestroy {
  aplicacaoNr1Id: string | null = null;
  cpf: string = '';
  loading: boolean = false;
  erro: string | null = null;
  aviso: string | null = null;
  sucesso: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pesquisaNr1Service: PesquisaNr1Service
  ) {}

  ngOnInit(): void {
    // Extrai o aplicacao_nr1_id da rota
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.aplicacaoNr1Id = params['aplicacao_nr1_id'] || null;
        if (!this.aplicacaoNr1Id) {
          this.erro = 'ID da aplicação não informado na URL.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Aplica máscara de CPF no campo de entrada.
   * Formato: XXX.XXX.XXX-XX
   */
  aplicarMascaraCpf(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 11);

    if (valor.length <= 3) {
      this.cpf = valor;
    } else if (valor.length <= 6) {
      this.cpf = `${valor.substring(0, 3)}.${valor.substring(3)}`;
    } else if (valor.length <= 9) {
      this.cpf = `${valor.substring(0, 3)}.${valor.substring(3, 6)}.${valor.substring(6)}`;
    } else {
      this.cpf = `${valor.substring(0, 3)}.${valor.substring(3, 6)}.${valor.substring(6, 9)}-${valor.substring(9)}`;
    }

    event.target.value = this.cpf;
  }

  /**
   * Valida e submete o formulário.
   */
  async acessarQuestionario(): Promise<void> {
    if (!this.aplicacaoNr1Id) {
      this.erro = 'Aplicação não identificada. Tente novamente.';
      return;
    }

    if (!this.cpf || this.cpf.replace(/\D/g, '').length !== 11) {
      this.erro = 'CPF deve conter 11 dígitos.';
      return;
    }

    this.loading = true;
    this.erro = null;
    this.aviso = null;
    this.sucesso = false;

    try {
      const resultado = await this.pesquisaNr1Service.vincularOuRecuperarTokenNr1(
        this.aplicacaoNr1Id,
        this.cpf
      );

      switch (resultado.status) {
        case 'sucesso':
          // Salva session_id e token no localStorage
          if (resultado.session_id && resultado.token) {
            localStorage.setItem('nr1_session_id', resultado.session_id);
            localStorage.setItem('nr1_token', resultado.token);
          }
          this.sucesso = true;
          // Aguarda um pouco para mostrar a mensagem antes de redirecionar
          setTimeout(() => {
            this.router.navigate(['/pesquisa/nr1', resultado.token]);
          }, 1000);
          break;

        case 'respondido':
          this.aviso = resultado.mensagem;
          break;

        case 'sem_tokens':
          this.aviso = resultado.mensagem;
          break;

        case 'aplicacao_inativa':
          this.erro = resultado.mensagem;
          break;

        case 'erro':
          this.erro = resultado.mensagem;
          break;
      }
    } catch (err: any) {
      console.error('Erro ao acessar questionário:', err);
      this.erro =
        err?.message || 'Erro ao processar sua requisição. Tente novamente mais tarde.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Limpa os campos do formulário.
   */
  limparFormulario(): void {
    this.cpf = '';
    this.erro = null;
    this.aviso = null;
    this.sucesso = false;
  }
}
