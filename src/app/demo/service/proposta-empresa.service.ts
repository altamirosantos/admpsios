import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type PropostaStatus = 'RASCUNHO' | 'ENVIADA' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';

export const PROPOSTA_STATUS: PropostaStatus[] = [
    'RASCUNHO',
    'ENVIADA',
    'APROVADA',
    'REJEITADA',
    'CANCELADA'
];

export interface PropostaEmpresaSummary {
    id: string;
    nome: string;
}

export interface PropostaModeloSummary {
    id: string;
    status: string | null;
}

/** Valores preenchidos para as chaves definidas no parametros_schema do modelo. */
export type PropostaParametros = Record<string, string | number | null>;

export interface PropostaEmpresa {
    id?: string;
    empresa_id: string;
    modelo_proposta_id: string | null;
    status: PropostaStatus;
    validade: string | null;
    vigencia: number | null;
    parametros: PropostaParametros;
    valor: number | null;
    empresa?: PropostaEmpresaSummary | null;
    modelo_proposta?: PropostaModeloSummary | null;
    created_at?: string | null;
    updated_at?: string | null;
}

type PropostaEmpresaRow = Omit<PropostaEmpresa, 'empresa' | 'modelo_proposta' | 'parametros'> & {
    empresa?: PropostaEmpresaSummary[] | PropostaEmpresaSummary | null;
    modelo_proposta?: PropostaModeloSummary[] | PropostaModeloSummary | null;
    parametros: unknown;
};

export type PropostaEmpresaPayload = Omit<
    PropostaEmpresa,
    'id' | 'empresa' | 'modelo_proposta' | 'created_at' | 'updated_at'
>;

@Injectable({
    providedIn: 'root'
})
export class PropostaEmpresaService {
    private readonly table = 'proposta_empresa';

    private readonly selectColumns = `
        id,
        empresa_id,
        modelo_proposta_id,
        status,
        validade,
        vigencia,
        parametros,
        valor,
        created_at,
        updated_at,
        empresa:empresa(id, nome),
        modelo_proposta:modelo_proposta(id, status)
    `;

    constructor(private readonly supabaseService: SupabaseService) {}

    async getAll(): Promise<PropostaEmpresa[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select(this.selectColumns)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false, nullsFirst: false });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapProposta(item as PropostaEmpresaRow));
    }

    async create(payload: PropostaEmpresaPayload): Promise<PropostaEmpresa> {
        const now = new Date().toISOString();

        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .insert({
                ...payload,
                created_at: now,
                updated_at: now
            })
            .select(this.selectColumns)
            .single();

        if (error) {
            throw error;
        }

        return this.mapProposta(data as PropostaEmpresaRow);
    }

    async update(id: string, payload: PropostaEmpresaPayload): Promise<PropostaEmpresa> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .update({
                ...payload,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(this.selectColumns)
            .single();

        if (error) {
            throw error;
        }

        return this.mapProposta(data as PropostaEmpresaRow);
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

    private mapProposta(item: PropostaEmpresaRow): PropostaEmpresa {
        const empresa = Array.isArray(item.empresa) ? item.empresa[0] || null : item.empresa || null;
        const modelo = Array.isArray(item.modelo_proposta)
            ? item.modelo_proposta[0] || null
            : item.modelo_proposta || null;

        return {
            ...item,
            status: (item.status as PropostaStatus) || 'RASCUNHO',
            parametros: this.parseParametros(item.parametros),
            empresa,
            modelo_proposta: modelo
        };
    }

    private parseParametros(value: unknown): PropostaParametros {
        let raw: unknown = value;

        if (typeof raw === 'string') {
            try {
                raw = JSON.parse(raw);
            } catch {
                return {};
            }
        }

        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return {};
        }

        return raw as PropostaParametros;
    }
}
