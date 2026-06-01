import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

interface CorrigeTextoEdicaoResponse {
  output?: {
    'texto-corrigido'?: string;
    'sugestoes-de-melhoria'?: string;
    'ajustes-realizados'?: string;
  } | string;
}

export interface EdicaoResourceSummary {
  id: string;
  title: string;
  type?: string | null;
  url?: string | null;
}

type EdicaoRow = Omit<EdicaoItem, 'resource'> & {
  resource?: EdicaoResourceSummary[] | EdicaoResourceSummary | null;
};

export interface EdicaoItem {
  id?: number;
  titulo: string;
  sinopse: string | null;
  roteiro: string | null;
  tipo: string;
  texto_original: string | null;
  texto_corrigido: string | null;
  sugestoes: string | null;
  ajustes: string | null;
  resource_id: string | null;
  resource?: EdicaoResourceSummary | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type EdicaoPayload = Omit<EdicaoItem, 'id' | 'created_at' | 'updated_at' | 'resource'>;

@Injectable({
  providedIn: 'root'
})
export class EdicaoService {
  private readonly table = 'edicao';
  private readonly corrigeTextoEdicaoFunction = 'corrige-texto-edicao';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<EdicaoItem[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(`
        id,
        titulo,
        sinopse,
        roteiro,
        tipo,
        texto_original,
        texto_corrigido,
        sugestoes,
        ajustes,
        resource_id,
        created_at,
        updated_at,
        resource:resources(id, title, type, url)
      `)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapEdicao(item as EdicaoRow));
  }

  private mapEdicao(item: EdicaoRow): EdicaoItem {
    const relatedResource = Array.isArray(item.resource)
      ? item.resource[0] || null
      : item.resource || null;

    return {
      ...item,
      resource: relatedResource
    };
  }

  async create(payload: EdicaoPayload): Promise<EdicaoItem> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .insert({
        ...payload,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(id: number, payload: EdicaoPayload): Promise<EdicaoItem> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async corrigirTexto(tipo: string, textoOriginal: string, acao: 'EDICAO' | 'ROTEIRO', sessionId: string): Promise<NonNullable<CorrigeTextoEdicaoResponse['output']>> {
    const { data, error } = await this.supabaseService.client.functions.invoke<CorrigeTextoEdicaoResponse>(
      this.corrigeTextoEdicaoFunction,
      {
        body: {
          acao,
          tipo,
          chatInput: textoOriginal,
          sessionId
        }
      }
    );

    if (error) {
      throw error;
    }

    if (!data?.output) {
      throw new Error('A Edge Function não retornou o bloco output esperado.');
    }

    return data.output;
  }
}
