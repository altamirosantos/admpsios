import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  private table = 'resources';

  constructor(private supabaseService: SupabaseService) {}

  async getAll() {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getById(id: number) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('*, resources(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getByTagsIn(tags: string[]) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('*')
      .overlaps('tags', tags) // <<<<< aqui o filtro por interseção
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async create(resposta: { description: string; type:string; url: string, duration:number, tags: string[] }) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .insert(resposta)
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, resposta: Partial<{ description: string; type:string; url: string, duration:number, tags: string[]  }>) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .update(resposta)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: number) {
    const { error } = await this.supabaseService['supabase']
      .from(this.table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
