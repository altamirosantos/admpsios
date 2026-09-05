import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ModeloStatus = 'ATIVO' | 'INATIVO';

export const MODELO_STATUS: ModeloStatus[] = ['ATIVO', 'INATIVO'];

/** Tipo do modelo: documento de PROPOSTA ou de CONTRATO. */
export type ModeloTipo = 'PROPOSTA' | 'CONTRATO';

export const MODELO_TIPO: ModeloTipo[] = ['PROPOSTA', 'CONTRATO'];

export type ParametroTipo = 'texto' | 'numero' | 'data' | 'moeda' | 'booleano';

/**
 * Definição de um parâmetro-chave do conteúdo do modelo.
 * A `chave` é o identificador usado no content no formato ${chave}.
 */
export interface ParametroSchema {
    chave: string;
    label: string;
    tipo: ParametroTipo;
}

export interface Modelo {
    id?: string;
    nome: string | null;
    status: ModeloStatus;
    tipo: ModeloTipo;
    content: string | null;
    parametros_schema: ParametroSchema[];
    created_at?: string | null;
    updated_at?: string | null;
}

export type ModeloPayload = Omit<Modelo, 'id' | 'created_at' | 'updated_at'>;

type ModeloRow = Omit<Modelo, 'parametros_schema'> & {
    parametros_schema: unknown;
};

@Injectable({
    providedIn: 'root'
})
export class ModeloService {
    private readonly table = 'modelo';
    private readonly columns = 'id, nome, status, tipo, content, parametros_schema, created_at, updated_at';

    constructor(private readonly supabaseService: SupabaseService) {}

    /** Lista todos os modelos; opcionalmente filtrando por tipo (PROPOSTA/CONTRATO). */
    async getAll(tipo?: ModeloTipo): Promise<Modelo[]> {
        let query = this.supabaseService.client
            .from(this.table)
            .select(this.columns);

        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        const { data, error } = await query
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false, nullsFirst: false });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapModelo(item as ModeloRow));
    }

    async create(payload: ModeloPayload): Promise<Modelo> {
        const now = new Date().toISOString();

        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .insert({
                ...payload,
                parametros_schema: payload.parametros_schema,
                created_at: now,
                updated_at: now
            })
            .select(this.columns)
            .single();

        if (error) {
            throw error;
        }

        return this.mapModelo(data as ModeloRow);
    }

    async update(id: string, payload: ModeloPayload): Promise<Modelo> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .update({
                ...payload,
                parametros_schema: payload.parametros_schema,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(this.columns)
            .single();

        if (error) {
            throw error;
        }

        return this.mapModelo(data as ModeloRow);
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

    /** Retorna apenas os modelos ATIVO, opcionalmente de um tipo (para seleção). */
    async getAtivos(tipo?: ModeloTipo): Promise<Modelo[]> {
        let query = this.supabaseService.client
            .from(this.table)
            .select(this.columns)
            .eq('status', 'ATIVO');

        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        const { data, error } = await query.order('updated_at', { ascending: false, nullsFirst: false });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapModelo(item as ModeloRow));
    }

    /** Normaliza a coluna JSON `parametros_schema` para um array tipado, tolerando dados legados. */
    private mapModelo(item: ModeloRow): Modelo {
        return {
            ...item,
            status: (item.status as ModeloStatus) || 'ATIVO',
            tipo: (item.tipo as ModeloTipo) || 'PROPOSTA',
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
