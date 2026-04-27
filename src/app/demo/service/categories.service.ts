import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface MediaCategory {
  id?: string;
  name: string;
  description: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly table = 'categories';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<MediaCategory[]> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('id, name, description')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async create(category: Omit<MediaCategory, 'id'>): Promise<MediaCategory> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .insert(category)
      .select('id, name, description')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(id: string, category: Partial<Omit<MediaCategory, 'id'>>): Promise<MediaCategory> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .update(category)
      .eq('id', id)
      .select('id, name, description')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService['supabase']
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}