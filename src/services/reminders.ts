import { supabase } from './supabase';

// Tipos para recordatorios
export interface Reminder {
    id: number;
    tipo: 'ot' | 'mantenimiento' | 'cliente' | 'general';
    entidad: string;
    entidad_id?: number;
    fecha_hora: string;
    canal: 'email' | 'sms' | 'push' | 'interno';
    nota?: string;
    estado: 'pendiente' | 'enviado' | 'completado' | 'cancelado';
    usuario_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateReminderParams {
    tipo: 'ot' | 'mantenimiento' | 'cliente' | 'general';
    entidad: string;
    entidad_id?: number;
    fecha_hora: string;
    canal: 'email' | 'sms' | 'push' | 'interno';
    nota?: string;
}

export interface ListMyRemindersParams {
    desde?: string;
    hasta?: string;
    estado?: 'pendiente' | 'enviado' | 'completado' | 'cancelado';
}

/**
 * Crea un nuevo recordatorio
 */
export async function createReminder(params: CreateReminderParams): Promise<Reminder> {
    const { data, error } = await supabase
        .from('recordatorios')
        .insert({
            tipo: params.tipo,
            entidad: params.entidad,
            entidad_id: params.entidad_id,
            fecha_hora: params.fecha_hora,
            canal: params.canal,
            nota: params.nota,
            estado: 'pendiente'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating reminder:', error);
        throw new Error(`Error al crear recordatorio: ${error.message}`);
    }

    return data;
}

/**
 * Lista los recordatorios del usuario actual
 */
export async function listMyReminders(params: ListMyRemindersParams = {}): Promise<Reminder[]> {
    let query = supabase
        .from('recordatorios')
        .select('*')
        .order('fecha_hora', { ascending: true });

    // Filtrar por fechas si se proporcionan
    if (params.desde) {
        query = query.gte('fecha_hora', params.desde);
    }
    if (params.hasta) {
        query = query.lte('fecha_hora', params.hasta);
    }

    // Filtrar por estado si se proporciona
    if (params.estado) {
        query = query.eq('estado', params.estado);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error listing reminders:', error);
        throw new Error(`Error al listar recordatorios: ${error.message}`);
    }

    return data || [];
}

/**
 * Marca un recordatorio como completado
 */
export async function completeReminder(id: number): Promise<Reminder> {
    const { data, error } = await supabase
        .from('recordatorios')
        .update({ 
            estado: 'completado',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error completing reminder:', error);
        throw new Error(`Error al completar recordatorio: ${error.message}`);
    }

    return data;
}

/**
 * Cancela un recordatorio
 */
export async function cancelReminder(id: number): Promise<Reminder> {
    const { data, error } = await supabase
        .from('recordatorios')
        .update({ 
            estado: 'cancelado',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error canceling reminder:', error);
        throw new Error(`Error al cancelar recordatorio: ${error.message}`);
    }

    return data;
}

/**
 * Obtiene un recordatorio específico por ID
 */
export async function getReminder(id: number): Promise<Reminder | null> {
    const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error getting reminder:', error);
        throw new Error(`Error al obtener recordatorio: ${error.message}`);
    }

    return data;
}

/**
 * Actualiza un recordatorio existente
 */
export async function updateReminder(id: number, updates: Partial<CreateReminderParams>): Promise<Reminder> {
    const { data, error } = await supabase
        .from('recordatorios')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating reminder:', error);
        throw new Error(`Error al actualizar recordatorio: ${error.message}`);
    }

    return data;
}

/**
 * Lista recordatorios próximos (siguientes 24 horas)
 */
export async function getUpcomingReminders(): Promise<Reminder[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return listMyReminders({
        desde: now.toISOString(),
        hasta: tomorrow.toISOString(),
        estado: 'pendiente'
    });
}