import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ModeloPropostaStatus = 'ATIVO' | 'INATIVO';

export const MODELO_PROPOSTA_STATUS: ModeloPropostaStatus[] = [
    'ATIVO',
    'INATIVO'
];

export type ParametroTipo = 'texto' | 'numero' | 'data' | 'moeda';

/**
 * Definição de um parâmetro-chave do conteúdo da proposta.
 * A `chave` é o identificador usado no content no formato ${chave}.
 */
export interface ParametroSchema {
    chave: string;
    label: string;
    tipo: ParametroTipo;
}

export interface ModeloProposta {
    id?: string;
    status: ModeloPropostaStatus;
    content: string | null;
    parametros_schema: ParametroSchema[];
    created_at?: string | null;
    updated_at?: string | null;
}

export type ModeloPropostaPayload = Omit<ModeloProposta, 'id' | 'created_at' | 'updated_at'>;

type ModeloPropostaRow = Omit<ModeloProposta, 'parametros_schema'> & {
    parametros_schema: unknown;
};

@Injectable({
    providedIn: 'root'
})
export class ModeloPropostaService {
    private readonly table = 'modelo_proposta';

    constructor(private readonly supabaseService: SupabaseService) {}

    async getAll(): Promise<ModeloProposta[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select('id, status, content, parametros_schema, created_at, updated_at')
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false, nullsFirst: false });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapModelo(item as ModeloPropostaRow));
    }

    async create(payload: ModeloPropostaPayload): Promise<ModeloProposta> {
        const now = new Date().toISOString();

        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .insert({
                ...payload,
                parametros_schema: payload.parametros_schema,
                created_at: now,
                updated_at: now
            })
            .select('id, status, content, parametros_schema, created_at, updated_at')
            .single();

        if (error) {
            throw error;
        }

        return this.mapModelo(data as ModeloPropostaRow);
    }

    async update(id: string, payload: ModeloPropostaPayload): Promise<ModeloProposta> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .update({
                ...payload,
                parametros_schema: payload.parametros_schema,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, status, content, parametros_schema, created_at, updated_at')
            .single();

        if (error) {
            throw error;
        }

        return this.mapModelo(data as ModeloPropostaRow);
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

    /** Retorna apenas os modelos com status ATIVO (para seleção em propostas). */
    async getAtivos(): Promise<ModeloProposta[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select('id, status, content, parametros_schema, created_at, updated_at')
            .eq('status', 'ATIVO')
            .order('updated_at', { ascending: false, nullsFirst: false });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapModelo(item as ModeloPropostaRow));
    }

    /** Normaliza a coluna JSON `parametros_schema` para um array tipado, tolerando dados legados. */
    private mapModelo(item: ModeloPropostaRow): ModeloProposta {
        return {
            ...item,
            status: (item.status as ModeloPropostaStatus) || 'ATIVO',
            parametros_schema: this.parseParametros(item.parametros_schema)
        };
    }

    private parseParametros(value: unknown): ParametroSchema[] {
        let raw: unknown = value;

        if (typeof raw === 'string') {
            try {
                raw = JSON.parse(raw);
            } catch {
                return [];
            }
        }

        if (!Array.isArray(raw)) {
            return [];
        }

        return raw
            .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
            .map((item) => ({
                chave: String(item['chave'] ?? '').trim(),
                label: String(item['label'] ?? '').trim(),
                tipo: (item['tipo'] as ParametroTipo) || 'texto'
            }))
            .filter((param) => param.chave.length > 0);
    }
}
