import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

interface CorrigeTextoEdicaoResponse {
  output?: {
    'texto-corrigido'?: string;
    'sugestoes-de-melhoria'?: string;
    'ajustes-realizados'?: string;
  };
}

export interface EdicaoItem {
  id?: number;
  titulo: string;
  sinopse: string | null;
  tipo: string;
  texto_original: string | null;
  texto_corrigido: string | null;
  sugestoes: string | null;
  ajustes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type EdicaoPayload = Omit<EdicaoItem, 'id' | 'created_at' | 'updated_at'>;

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
      .select('*')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return data || [];
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

  async corrigirTexto(tipo: string, textoOriginal: string, sessionId: string): Promise<Required<CorrigeTextoEdicaoResponse>['output']> {
    const { data, error } = await this.supabaseService.client.functions.invoke<CorrigeTextoEdicaoResponse>(
      this.corrigeTextoEdicaoFunction,
      {
        body: {
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