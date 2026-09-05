import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ContratoStatus = 'RASCUNHO' | 'ENVIADO' | 'ASSINADO' | 'CANCELADO' | 'ENCERRADO';

export const CONTRATO_STATUS: ContratoStatus[] = [
    'RASCUNHO',
    'ENVIADO',
    'ASSINADO',
    'CANCELADO',
    'ENCERRADO'
];

export interface ContratoEmpresaSummary {
    id: string;
    nome: string;
}

export interface ContratoModeloSummary {
    id: string;
    status: string | null;
}

/** Valores preenchidos para as chaves definidas no parametros_schema do modelo. */
export type ContratoParametros = Record<string, string | number | null>;

export interface ContratoEmpresa {
    id?: string;
    empresa_id: string;
    modelo_id: string | null;
    status: ContratoStatus;
    validade: string | null;
    vigencia: number | null;
    parametros: ContratoParametros;
    valor: number | null;
    empresa?: ContratoEmpresaSummary | null;
    modelo?: ContratoModeloSummary | null;
    created_at?: string | null;
    updated_at?: string | null;
}

type ContratoEmpresaRow = Omit<ContratoEmpresa, 'empresa' | 'modelo' | 'parametros'> & {
    empresa?: ContratoEmpresaSummary[] | ContratoEmpresaSummary | null;
    modelo?: ContratoModeloSummary[] | ContratoModeloSummary | null;
    parametros: unknown;
};

export type ContratoEmpresaPayload = Omit<
    ContratoEmpresa,
    'id' | 'empresa' | 'modelo' | 'created_at' | 'updated_at'
>;

@Injectable({
    providedIn: 'root'
})
export class ContratoEmpresaService {
    private readonly table = 'contrato_empresa';

    private readonly selectColumns = `
        id,
        empresa_id,
        modelo_id,
        status,
        validade,
        vigencia,
        parametros,
        valor,
        created_at,
        updated_at,
        empresa:empresa(id, nome),
        modelo:modelo(id, status)
    `;

    constructor(private readonly supabaseService: SupabaseService) {}

    async getAll(): Promise<ContratoEmpresa[]> {
        const { data, error } = await this.supabaseService.client
            .from(this.table)
            .select(this.selectColumns)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false, nullsFirst: false });

        if (error) {
            throw error;
        }

        return (data || []).map((item) => this.mapContrato(item as ContratoEmpresaRow));
    }

    async create(payload: ContratoEmpresaPayload): Promise<ContratoEmpresa> {
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

        return this.mapContrato(data as ContratoEmpresaRow);
    }

    async update(id: string, payload: ContratoEmpresaPayload): Promise<ContratoEmpresa> {
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

        return this.mapContrato(data as ContratoEmpresaRow);
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

    private mapContrato(item: ContratoEmpresaRow): ContratoEmpresa {
        const empresa = Array.isArray(item.empresa) ? item.empresa[0] || null : item.empresa || null;
        const modelo = Array.isArray(item.modelo) ? item.modelo[0] || null : item.modelo || null;

        return {
            ...item,
            status: (item.status as ContratoStatus) || 'RASCUNHO',
            parametros: this.parseParametros(item.parametros),
            empresa,
            modelo
        };
    }

    private parseParametros(value: unknown): ContratoParametros {
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

        return raw as ContratoParametros;
    }
}
