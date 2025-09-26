import { supabase } from './supabase';

// Interfaces
export interface AIProvider {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  configuracion: any;
  created_at: string;
  updated_at: string;
}

export interface AIKey {
  id: number;
  provider_id: number;
  nombre: string;
  key_visible: string; // Solo los últimos 4 caracteres
  activa: boolean;
  created_at: string;
  updated_at: string;
  provider?: AIProvider;
}

export interface AIPrompt {
  id: number;
  nombre: string;
  descripcion?: string;
  template: string;
  variables: string[];
  categoria: string;
  activo: boolean;
  empresa_id?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AIRun {
  id: number;
  prompt_id?: number;
  provider_id: number;
  key_id: number;
  input_text: string;
  output_text?: string;
  tokens_input: number;
  tokens_output: number;
  costo_estimado: number;
  duracion_ms: number;
  estado: 'pending' | 'completed' | 'error';
  error_message?: string;
  empresa_id?: number;
  user_id: string;
  created_at: string;
  prompt?: AIPrompt;
  provider?: AIProvider;
}

export interface AIMetric {
  fecha: string;
  empresa_id?: number;
  total_runs: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_costo: number;
  promedio_duracion_ms: number;
  runs_exitosos: number;
  runs_error: number;
}

export interface CreateOrUpdatePromptParams {
  id?: number;
  nombre: string;
  descripcion?: string;
  template: string;
  variables: string[];
  categoria: string;
  activo?: boolean;
}

export interface ListRunsParams {
  fecha?: string;
  empresa_id?: number;
  usuario_id?: string;
  limit?: number;
  offset?: number;
}

export interface ListDailyMetricsParams {
  desde: string;
  hasta: string;
  empresa_id?: number;
}

// Funciones del servicio

/**
 * Lista todos los providers de AI disponibles
 */
export async function listProviders(): Promise<AIProvider[]> {
  const { data, error } = await supabase
    .from('ai_providers')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('Error fetching AI providers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Lista las keys visibles (solo últimos 4 caracteres) con información del provider
 */
export async function listKeysVisible(): Promise<AIKey[]> {
  const { data, error } = await supabase
    .from('ai_keys')
    .select(`
      *,
      provider:ai_providers(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching AI keys:', error);
    throw error;
  }

  return data || [];
}

/**
 * Lista todos los prompts del usuario actual
 */
export async function listPrompts(): Promise<AIPrompt[]> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching AI prompts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Crea o actualiza un prompt
 */
export async function createOrUpdatePrompt(input: CreateOrUpdatePromptParams): Promise<AIPrompt> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const promptData = {
    nombre: input.nombre,
    descripcion: input.descripcion,
    template: input.template,
    variables: input.variables,
    categoria: input.categoria,
    activo: input.activo ?? true,
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  let result;

  if (input.id) {
    // Actualizar prompt existente
    const { data, error } = await supabase
      .from('ai_prompts')
      .update(promptData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating AI prompt:', error);
      throw error;
    }
    result = data;
  } else {
    // Crear nuevo prompt
    const { data, error } = await supabase
      .from('ai_prompts')
      .insert({
        ...promptData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI prompt:', error);
      throw error;
    }
    result = data;
  }

  return result;
}

/**
 * Lista las ejecuciones de AI con filtros opcionales
 */
export async function listRuns(params: ListRunsParams = {}): Promise<AIRun[]> {
  let query = supabase
    .from('ai_runs')
    .select(`
      *,
      prompt:ai_prompts(nombre, categoria),
      provider:ai_providers(nombre, tipo)
    `);

  // Aplicar filtros
  if (params.fecha) {
    const startDate = new Date(params.fecha);
    const endDate = new Date(params.fecha);
    endDate.setDate(endDate.getDate() + 1);
    
    query = query
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());
  }

  if (params.empresa_id) {
    query = query.eq('empresa_id', params.empresa_id);
  }

  if (params.usuario_id) {
    query = query.eq('user_id', params.usuario_id);
  }

  // Paginación
  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching AI runs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Lista métricas diarias agregadas
 */
export async function listDailyMetrics(params: ListDailyMetricsParams): Promise<AIMetric[]> {
  let query = supabase
    .from('ai_daily_metrics')
    .select('*');

  // Filtros de fecha
  query = query
    .gte('fecha', params.desde)
    .lte('fecha', params.hasta);

  if (params.empresa_id) {
    query = query.eq('empresa_id', params.empresa_id);
  }

  query = query.order('fecha', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching AI daily metrics:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene un prompt específico por ID
 */
export async function getPrompt(id: number): Promise<AIPrompt | null> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    console.error('Error fetching AI prompt:', error);
    throw error;
  }

  return data;
}

/**
 * Desactiva un prompt (soft delete)
 */
export async function deactivatePrompt(id: number): Promise<void> {
  const { error } = await supabase
    .from('ai_prompts')
    .update({ 
      activo: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating AI prompt:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas generales de uso de AI
 */
export async function getGeneralStats(): Promise<{
  total_runs: number;
  total_prompts: number;
  total_providers: number;
  total_keys: number;
}> {
  const [runsResult, promptsResult, providersResult, keysResult] = await Promise.all([
    supabase.from('ai_runs').select('id', { count: 'exact', head: true }),
    supabase.from('ai_prompts').select('id', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('ai_providers').select('id', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('ai_keys').select('id', { count: 'exact', head: true }).eq('activa', true)
  ]);

  return {
    total_runs: runsResult.count || 0,
    total_prompts: promptsResult.count || 0,
    total_providers: providersResult.count || 0,
    total_keys: keysResult.count || 0
  };
}