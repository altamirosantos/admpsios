import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ServicoResumo {
    id: string;
    nome: string;
    descricao?: string | null;
}

export interface ServicoPropostaEmpresa {
    id?: string;
    proposta_empresa_id: string;
    servico_proposta_id: string;
    qtde: number;
    servico?: ServicoResumo | null;
}

type ServicoPropostaEmpresaRow = Omit<ServicoPropostaEmpresa, 'servico'> & {
    servicos_proposta?: ServicoResumo[] | ServicoResumo | null;
};

/** Item usado para persistir os serviços de uma proposta. */
export interface ServicoItemPayload {
    servico_proposta_id: string;
    qtde: number;
}

@Injectable({
    providedIn: 'root'
})
export class ServicoPropostaEmpresaService {
    private readonly table = 'servico_proposta_empresa';

    private readonly selectColumns = `
        id,
        proposta_empresa_id,
        servico_proposta_id,
        qtde,
        servicos_proposta:servicos_proposta(id, nome, descricao)
    `;

    constructor(private readonly supabaseService: SupabaseService) {}

    /** Lista os serviços vinculados a uma proposta. */
    async getByProposta(propostaId: string): Promise<ServicoPropostaEmpresa[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select(this.selectColumns)
            .eq('proposta_empresa_id', propostaId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapItem(item as ServicoPropostaEmpresaRow));
    }

    /**
     * Sincroniza os serviços de uma proposta: remove os itens atuais e reinsere a
     * lista informada. Simples e consistente para uma edição de 1..n itens.
     */
    async syncItens(propostaId: string, itens: ServicoItemPayload[]): Promise<void> {
        const { error: deleteError } = await this.supabaseService.client
            .from(this.table)
            .delete()
            .eq('proposta_empresa_id', propostaId);

        if (deleteError) {
            throw deleteError;
        }

        const validos = itens.filter((item) => item.servico_proposta_id);

        if (validos.length === 0) {
            return;
        }

        const now = new Date().toISOString();
        const rows = validos.map((item) => ({
            proposta_empresa_id: propostaId,
            servico_proposta_id: item.servico_proposta_id,
            qtde: item.qtde && item.qtde > 0 ? item.qtde : 1,
            created_at: now,
            updated_at: now
        }));

        const { error: insertError } = await this.supabaseService.client
            .from(this.table)
            .insert(rows);

        if (insertError) {
            throw insertError;
        }
    }

    private mapItem(item: ServicoPropostaEmpresaRow): ServicoPropostaEmpresa {
        const servico = Array.isArray(item.servicos_proposta)
            ? item.servicos_proposta[0] || null
            : item.servicos_proposta || null;

        return {
            id: item.id,
            proposta_empresa_id: item.proposta_empresa_id,
            servico_proposta_id: item.servico_proposta_id,
            qtde: item.qtde ?? 1,
            servico
        };
    }
}
