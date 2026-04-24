import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface N8nChatHistoryRecord {
  id?: number | string;
  session_id: string | null;
  user_id: string | null;
  message: unknown;
  created_at: string;
}

export interface N8nChatHistoryFilter {
  userId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface N8nChatHistoryPagination {
  page: number;
  pageSize: number;
}

export interface N8nChatHistoryPage {
  data: N8nChatHistoryRecord[];
  total: number;
}

export interface ProfileOption {
  id: string;
  nome: string | null;
  apelido: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class N8nChatHistoryService {
  private readonly tableName = 'n8n_chat_histories';
  private readonly minFilterDate = '1900-01-01T00:00:00.000Z';
  private readonly maxFilterDate = '9999-12-31T23:59:59.999Z';

  constructor(private readonly supabaseService: SupabaseService) {}

  private buildSessionPrefixFilter(userId: string): string {
    return `${userId}|%`;
  }

  async getProfiles(): Promise<ProfileOption[]> {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('id, nome, apelido')
      .order('nome', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).filter((profile): profile is ProfileOption => !!profile.id);
  }

  async getChatHistories(filters: N8nChatHistoryFilter = {}): Promise<N8nChatHistoryRecord[]> {
    const { startDate, endDate } = this.normalizeDateRange(filters.startDate, filters.endDate);

    let query = this.supabaseService.client
      .from(this.tableName)
      .select('id, session_id, user_id, message, created_at')
      .order('created_at', { ascending: true });

    if (filters.userId) {
      query = query.ilike('session_id', this.buildSessionPrefixFilter(filters.userId));
    }

    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  async getChatHistoriesPage(
    pagination: N8nChatHistoryPagination,
    filters?: N8nChatHistoryFilter
  ): Promise<N8nChatHistoryPage> {
    const normalizedFilters = filters || {};
    const { startDate, endDate } = this.normalizeDateRange(normalizedFilters.startDate, normalizedFilters.endDate);
    const safePage = Math.max(0, pagination.page || 0);
    const safePageSize = Math.max(1, pagination.pageSize || 20);
    const from = safePage * safePageSize;
    const to = from + safePageSize - 1;

    let query = this.supabaseService.client
      .from(this.tableName)
      .select('id, session_id, user_id, message, created_at', { count: 'exact' })
      .order('created_at', { ascending: true })
      .range(from, to);

    if (normalizedFilters.userId) {
      query = query.ilike('session_id', this.buildSessionPrefixFilter(normalizedFilters.userId));
    }

    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0
    };
  }

  private normalizeDateRange(startDate?: Date | null, endDate?: Date | null): { startDate: string; endDate: string } {
    return {
      startDate: startDate ? this.toStartOfDay(startDate) : this.minFilterDate,
      endDate: endDate ? this.toEndOfDay(endDate) : this.maxFilterDate
    };
  }

  private toStartOfDay(date: Date): string {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate.toISOString();
  }

  private toEndOfDay(date: Date): string {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(23, 59, 59, 999);
    return normalizedDate.toISOString();
  }
}
