import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ServicoPropostaStatus = 'ATIVO' | 'INATIVO';

export const SERVICO_PROPOSTA_STATUS: ServicoPropostaStatus[] = ['ATIVO', 'INATIVO'];

export interface ServicoProposta {
    id?: string;
    status: ServicoPropostaStatus;
    nome: string;
    descricao: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export type ServicoPropostaPayload = Omit<ServicoProposta, 'id' | 'created_at' | 'updated_at'>;

@Injectable({
    providedIn: 'root'
})
export class ServicosPropostaService {
    private readonly table = 'servicos_proposta';

    constructor(private readonly supabaseService: SupabaseService) {}

    async getAll(): Promise<ServicoProposta[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select('id, status, nome, descricao, created_at, updated_at')
            .order('nome', { ascending: true });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapServico(item));
    }

    /** Retorna apenas os serviços ATIVOS (para seleção em propostas). */
    async getAtivos(): Promise<ServicoProposta[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select('id, status, nome, descricao, created_at, updated_at')
            .eq('status', 'ATIVO')
            .order('nome', { ascending: true });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapServico(item));
    }

    async create(payload: ServicoPropostaPayload): Promise<ServicoProposta> {
        const now = new Date().toISOString();

        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .insert({
                ...payload,
                created_at: now,
                updated_at: now
            })
            .select('id, status, nome, descricao, created_at, updated_at')
            .single();

        if (error) {
            throw error;
        }

        return this.mapServico(data);
    }

    async update(id: string, payload: ServicoPropostaPayload): Promise<ServicoProposta> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .update({
                ...payload,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, status, nome, descricao, created_at, updated_at')
            .single();

        if (error) {
            throw error;
        }

        return this.mapServico(data);
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabaseService.client
            .from(this.table)
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    }

    private mapServico(item: any): ServicoProposta {
        return {
            ...item,
            status: (item.status as ServicoPropostaStatus) || 'ATIVO'
        };
    }
}
