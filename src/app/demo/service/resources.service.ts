import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ResourceType = 'exercise' | 'audio' | 'video' | 'document';

export interface ResourceCategoryLink {
  category_id: string;
  categories?: {
    id: string;
    name: string;
  } | null;
}

export interface ResourceItem {
  id?: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  duration: number | null;
  tags: string[];
  interactive_data: Record<string, unknown> | null;
  created_at?: string;
  resource_categories?: ResourceCategoryLink[];
  category_ids?: string[];
  category_names?: string[];
}

export type ResourcePayload = Omit<ResourceItem, 'id' | 'created_at' | 'resource_categories' | 'category_ids' | 'category_names'>;

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  private readonly table = 'resources';
  private readonly relationTable = 'resource_categories';
  private readonly mediaBucket = 'psios_midias';

  constructor(private supabaseService: SupabaseService) {}

  async getAll(): Promise<ResourceItem[]> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select(`
        id,
        title,
        description,
        type,
        url,
        duration,
        tags,
        interactive_data,
        created_at,
        resource_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((item) => this.mapResource(item));
  }

  async getById(id: string): Promise<ResourceItem> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select(`
        id,
        title,
        description,
        type,
        url,
        duration,
        tags,
        interactive_data,
        created_at,
        resource_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return this.mapResource(data);
  }

  async getByTagsIn(tags: string[]): Promise<ResourceItem[]> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select(`
        id,
        title,
        description,
        type,
        url,
        duration,
        tags,
        interactive_data,
        created_at,
        resource_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `)
      .overlaps('tags', tags)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((item) => this.mapResource(item));
  }

  async create(resource: ResourcePayload, categoryIds: string[]): Promise<ResourceItem> {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .insert(resource)
      .select(`
        id,
        title,
        description,
        type,
        url,
        duration,
        tags,
        interactive_data,
        created_at
      `)
      .single();
    if (error) throw error;

    await this.syncCategories(data.id, categoryIds);
    return this.getById(data.id);
  }

  async update(id: string, resource: Partial<ResourcePayload>, categoryIds: string[]): Promise<ResourceItem> {
    const { error } = await this.supabaseService['supabase']
      .from(this.table)
      .update(resource)
      .eq('id', id);
    if (error) throw error;

    await this.syncCategories(id, categoryIds);
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    const relationDelete = await this.supabaseService['supabase']
      .from(this.relationTable)
      .delete()
      .eq('resource_id', id);

    if (relationDelete.error) throw relationDelete.error;

    const { error } = await this.supabaseService['supabase']
      .from(this.table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async uploadMediaFile(file: File, targetFileName?: string | null): Promise<string> {
    const fileName = this.resolveUploadFileName(file.name, targetFileName);
    const { error } = await this.supabaseService.client.storage
      .from(this.mediaBucket)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type || undefined
      });

    if (error) {
      throw error;
    }

    return fileName;
  }

  async deleteMediaFile(fileName: string): Promise<void> {
    const normalizedFileName = fileName.trim();

    if (!normalizedFileName) {
      return;
    }

    const { error } = await this.supabaseService.client.storage
      .from(this.mediaBucket)
      .remove([normalizedFileName]);

    if (error) {
      throw error;
    }
  }

  async getMediaFileUrl(fileName: string): Promise<string> {
    const normalizedFileName = fileName.trim();

    if (!normalizedFileName) {
      throw new Error('Arquivo de mídia não informado.');
    }

    const { data, error } = await this.supabaseService.client.storage
      .from(this.mediaBucket)
      .createSignedUrl(normalizedFileName, 60 * 60);

    if (error || !data?.signedUrl) {
      throw error || new Error('Não foi possível gerar a URL da mídia.');
    }

    return data.signedUrl;
  }

  private async syncCategories(resourceId: string, categoryIds: string[]): Promise<void> {
    const deleteResult = await this.supabaseService['supabase']
      .from(this.relationTable)
      .delete()
      .eq('resource_id', resourceId);

    if (deleteResult.error) {
      throw deleteResult.error;
    }

    if (!categoryIds.length) {
      return;
    }

    const insertResult = await this.supabaseService['supabase']
      .from(this.relationTable)
      .insert(categoryIds.map((categoryId) => ({
        resource_id: resourceId,
        category_id: categoryId
      })));

    if (insertResult.error) {
      throw insertResult.error;
    }
  }

  private mapResource(resource: any): ResourceItem {
    const links: ResourceCategoryLink[] = Array.isArray(resource?.resource_categories)
      ? resource.resource_categories
      : [];

    return {
      id: resource.id,
      title: resource.title,
      description: resource.description ?? null,
      type: resource.type,
      url: resource.url ?? null,
      duration: resource.duration ?? null,
      tags: Array.isArray(resource.tags) ? resource.tags : [],
      interactive_data: resource.interactive_data ?? null,
      created_at: resource.created_at,
      resource_categories: links,
      category_ids: links.map((link) => link.category_id),
      category_names: links
        .map((link) => link.categories?.name)
        .filter((name): name is string => !!name)
    };
  }

  private resolveUploadFileName(originalFileName: string, targetFileName?: string | null): string {
    const normalizedTarget = targetFileName?.trim();

    if (normalizedTarget) {
      return normalizedTarget;
    }

    const normalizedFileName = originalFileName.trim().normalize('NFD');
    let sanitizedFileName = '';
    let lastWasDash = false;

    for (const character of normalizedFileName) {
      const code = character.codePointAt(0) || 0;
      const isCombiningMark = code >= 0x0300 && code <= 0x036f;

      if (isCombiningMark) {
        continue;
      }

      const isAlphaNumeric =
        (code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122);

      if (isAlphaNumeric || character === '.' || character === '_' || character === '-') {
        sanitizedFileName += character;
        lastWasDash = character === '-';
        continue;
      }

      if (!lastWasDash) {
        sanitizedFileName += '-';
        lastWasDash = true;
      }
    }

    while (sanitizedFileName.startsWith('-')) {
      sanitizedFileName = sanitizedFileName.slice(1);
    }

    while (sanitizedFileName.endsWith('-')) {
      sanitizedFileName = sanitizedFileName.slice(0, -1);
    }

    return `${Date.now()}-${sanitizedFileName || 'arquivo'}`;
  }
}
