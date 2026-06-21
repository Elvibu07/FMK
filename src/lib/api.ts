import { supabase } from './supabase';
import { Aspirante, Convocatoria, Judge, Tribunal } from '../types';

// ==========================================
// SISTEMA HÍBRIDO: localStorage + Supabase
// - Siempre guarda en localStorage de inmediato
// - Intenta sincronizar con Supabase en background
// - Al cargar, prioriza Supabase; fallback a localStorage
// ==========================================

const KEYS = {
  ASPIRANTES: 'fmk_aspirantes',
  CONVOCATORIAS: 'fmk_convocatorias',
  TRIBUNALES: 'fmk_tribunales',
  JUDGES: 'fmk_judges',
};

function ls_get<T>(key: string): T[] {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : []; }
  catch { return []; }
}

function ls_set<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { console.error('localStorage write error:', e); }
}

// ==========================================
// ASPIRANTES
// ==========================================
export async function fetchAspirantes(): Promise<Aspirante[]> {
  try {
    const { data, error } = await supabase
      .from('aspirantes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped: Aspirante[] = data.map(row => ({
        id: row.id, name: row.name, email: row.email, club: row.club || '',
        estilo: row.estilo as any, avatarUrl: row.avatar_url,
        currentBelt: row.current_belt || '', requestedBelt: row.requested_belt || '',
        fechaUltimoGrado: row.fecha_ultimo_grado,
        licenciasAcumuladas: row.licencias_acumuladas,
        licenciasConsecutivas: row.licencias_consecutivas,
        status: row.status as any, progressStep: row.progress_step,
        convocatoriaId: row.convocatoria_id, via: row.via as any,
        avalTecnico: row.aval_tecnico, avalAceptado: row.aval_aceptado,
        paymentStatus: row.payment_status as any,
        correctionReason: row.correction_reason,
        assignedTribunalId: row.assigned_tribunal_id, birthDate: row.birth_date,
        documents: { dni: { name: '', uploaded: false }, photo: { name: '', uploaded: false }, license: { name: '', uploaded: false } },
        documentos: [],
      }));
      ls_set(KEYS.ASPIRANTES, mapped); // sincronizar localStorage
      return mapped;
    }
  } catch (e) { console.warn('[api] Supabase error, usando localStorage:', e); }

  // Fallback: localStorage
  const local = ls_get<Aspirante>(KEYS.ASPIRANTES);
  // Deduplicar por ID
  return Array.from(new Map(local.map(a => [a.id, a])).values()).map(a => ({
    ...a,
    documents: a.documents || { dni: { name: '', uploaded: false }, photo: { name: '', uploaded: false }, license: { name: '', uploaded: false } },
    documentos: a.documentos || [],
  }));
}

export async function createAspirante(aspirante: Partial<Aspirante>): Promise<boolean> {
  const id = aspirante.id || `asp-${Date.now()}`;
  const nueva: Aspirante = {
    id, name: aspirante.name || 'Sin Nombre', email: aspirante.email || '',
    club: aspirante.club || '', estilo: aspirante.estilo || 'Shotokan',
    avatarUrl: aspirante.avatarUrl, currentBelt: aspirante.currentBelt || '',
    requestedBelt: aspirante.requestedBelt || '',
    fechaUltimoGrado: aspirante.fechaUltimoGrado,
    licenciasAcumuladas: aspirante.licenciasAcumuladas || 0,
    licenciasConsecutivas: aspirante.licenciasConsecutivas || 0,
    status: aspirante.status || 'Borrador', progressStep: aspirante.progressStep || 1,
    paymentStatus: aspirante.paymentStatus || 'Unpaid', birthDate: aspirante.birthDate,
    documents: { dni: { name: '', uploaded: false }, photo: { name: '', uploaded: false }, license: { name: '', uploaded: false } },
    documentos: [],
  };

  // 1. Guardar en localStorage INMEDIATAMENTE
  const list = ls_get<Aspirante>(KEYS.ASPIRANTES);
  ls_set(KEYS.ASPIRANTES, [nueva, ...list.filter(a => a.id !== id)]);

  // 2. Intentar Supabase en background
  supabase.from('aspirantes').insert([{
    id, name: nueva.name, email: nueva.email, club: nueva.club,
    estilo: nueva.estilo, avatar_url: nueva.avatarUrl,
    current_belt: nueva.currentBelt, requested_belt: nueva.requestedBelt,
    fecha_ultimo_grado: nueva.fechaUltimoGrado || null,
    licencias_acumuladas: nueva.licenciasAcumuladas,
    licencias_consecutivas: nueva.licenciasConsecutivas,
    status: nueva.status, progress_step: nueva.progressStep,
    payment_status: nueva.paymentStatus, birth_date: nueva.birthDate || null,
  }]).then(({ error }) => {
    if (error) console.warn('[api] Aspirante guardado en local, Supabase falló:', error.message);
    else console.log('[api] Aspirante sincronizado con Supabase ✅');
  });

  return true;
}

export async function updateAspirante(id: string, updates: Partial<Aspirante>): Promise<boolean> {
  // 1. Actualizar localStorage INMEDIATAMENTE
  const list = ls_get<Aspirante>(KEYS.ASPIRANTES);
  ls_set(KEYS.ASPIRANTES, list.map(a => a.id === id ? { ...a, ...updates } : a));

  // 2. Intentar Supabase en background
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.club !== undefined) payload.club = updates.club;
  if (updates.estilo !== undefined) payload.estilo = updates.estilo;
  if (updates.currentBelt !== undefined) payload.current_belt = updates.currentBelt;
  if (updates.requestedBelt !== undefined) payload.requested_belt = updates.requestedBelt;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.progressStep !== undefined) payload.progress_step = updates.progressStep;
  if (updates.convocatoriaId !== undefined) payload.convocatoria_id = updates.convocatoriaId;
  if (updates.avalTecnico !== undefined) payload.aval_tecnico = updates.avalTecnico;
  if (updates.avalAceptado !== undefined) payload.aval_aceptado = updates.avalAceptado;
  if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
  if (updates.correctionReason !== undefined) payload.correction_reason = updates.correctionReason;
  if (updates.assignedTribunalId !== undefined) payload.assigned_tribunal_id = updates.assignedTribunalId;

  supabase.from('aspirantes').update(payload).eq('id', id)
    .then(({ error }) => { if (error) console.warn('[api] update aspirante Supabase falló:', error.message); });

  return true;
}

// ==========================================
// CONVOCATORIAS
// ==========================================
export async function fetchConvocatorias(): Promise<Convocatoria[]> {
  try {
    const { data, error } = await supabase
      .from('convocatorias').select('*').order('fecha', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: Convocatoria[] = data.map(row => ({
        id: row.id, titulo: row.titulo, fecha: row.fecha, sede: row.sede,
        gradesAdmitidos: row.grades_admitidos || [],
        plazoOrdinario: row.plazo_ordinario, estado: row.estado as any,
        cupoMaximo: row.cupo_maximo, inscritos: row.inscritos, observaciones: row.observaciones,
      }));
      ls_set(KEYS.CONVOCATORIAS, mapped);
      return mapped;
    }
  } catch (e) { console.warn('[api] Supabase error convocatorias:', e); }
  return ls_get<Convocatoria>(KEYS.CONVOCATORIAS);
}

export async function createConvocatoria(convocatoria: Partial<Convocatoria>): Promise<boolean> {
  const id = convocatoria.id || `conv-${Date.now()}`;
  const nueva = {
    id, titulo: convocatoria.titulo || 'Sin Título',
    fecha: convocatoria.fecha || new Date().toISOString().split('T')[0],
    sede: convocatoria.sede || '',
    gradesAdmitidos: convocatoria.gradesAdmitidos || [],
    plazoOrdinario: convocatoria.plazoOrdinario,
    estado: convocatoria.estado || 'Borrador',
    cupoMaximo: convocatoria.cupoMaximo || 40,
    inscritos: convocatoria.inscritos || 0,
    observaciones: convocatoria.observaciones || '',
  } as Convocatoria;

  // 1. localStorage inmediato
  const list = ls_get<Convocatoria>(KEYS.CONVOCATORIAS);
  ls_set(KEYS.CONVOCATORIAS, [...list.filter(c => c.id !== id), nueva]);

  // 2. Supabase en background
  supabase.from('convocatorias').insert([{
    id, titulo: nueva.titulo, fecha: nueva.fecha, sede: nueva.sede,
    grades_admitidos: nueva.gradesAdmitidos,
    plazo_ordinario: nueva.plazoOrdinario || null,
    estado: nueva.estado, cupo_maximo: nueva.cupoMaximo,
    inscritos: nueva.inscritos, observaciones: nueva.observaciones,
  }]).then(({ error }) => {
    if (error) console.warn('[api] Convocatoria guardada en local, Supabase falló:', error.message);
    else console.log('[api] Convocatoria sincronizada ✅');
  });

  return true;
}

export async function updateConvocatoria(id: string, updates: Partial<Convocatoria>): Promise<boolean> {
  const list = ls_get<Convocatoria>(KEYS.CONVOCATORIAS);
  ls_set(KEYS.CONVOCATORIAS, list.map(c => c.id === id ? { ...c, ...updates } : c));

  const payload: any = {};
  if (updates.estado !== undefined) payload.estado = updates.estado;
  if (updates.inscritos !== undefined) payload.inscritos = updates.inscritos;
  if (updates.titulo !== undefined) payload.titulo = updates.titulo;
  if (updates.sede !== undefined) payload.sede = updates.sede;
  if (updates.cupoMaximo !== undefined) payload.cupo_maximo = updates.cupoMaximo;

  supabase.from('convocatorias').update(payload).eq('id', id)
    .then(({ error }) => { if (error) console.warn('[api] update convocatoria Supabase falló:', error.message); });

  return true;
}

// ==========================================
// TRIBUNALES
// ==========================================
export async function fetchTribunals(): Promise<Tribunal[]> {
  try {
    const { data, error } = await supabase.from('tribunales').select('*');
    if (!error && data && data.length > 0) {
      const mapped: Tribunal[] = data.map(row => ({
        id: row.id, name: row.name, isMain: row.is_main,
        convocatoriaId: row.convocatoria_id, judges: [],
      }));
      ls_set(KEYS.TRIBUNALES, mapped);
      return mapped;
    }
  } catch (e) { console.warn('[api] Supabase error tribunales:', e); }
  return ls_get<Tribunal>(KEYS.TRIBUNALES);
}

export async function createTribunal(tribunal: Partial<Tribunal>): Promise<boolean> {
  const id = tribunal.id || `trib-${Date.now()}`;
  const nueva: Tribunal = {
    id, name: tribunal.name || 'Nuevo Tribunal',
    isMain: tribunal.isMain || false,
    convocatoriaId: tribunal.convocatoriaId, judges: tribunal.judges || [],
  };
  const list = ls_get<Tribunal>(KEYS.TRIBUNALES);
  ls_set(KEYS.TRIBUNALES, [...list, nueva]);

  supabase.from('tribunales').insert([{
    id, name: nueva.name, is_main: nueva.isMain,
    convocatoria_id: nueva.convocatoriaId || null,
  }]).then(({ error }) => { if (error) console.warn('[api] Tribunal Supabase falló:', error.message); });

  return true;
}

export async function updateTribunal(id: string, updates: Partial<Tribunal>): Promise<boolean> {
  const list = ls_get<Tribunal>(KEYS.TRIBUNALES);
  ls_set(KEYS.TRIBUNALES, list.map(t => t.id === id ? { ...t, ...updates } : t));

  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.isMain !== undefined) payload.is_main = updates.isMain;

  supabase.from('tribunales').update(payload).eq('id', id)
    .then(({ error }) => { if (error) console.warn('[api] update tribunal Supabase falló:', error.message); });

  return true;
}

// ==========================================
// JUDGES
// ==========================================
export async function fetchJudges(): Promise<Judge[]> {
  try {
    const { data, error } = await supabase.from('judges').select('*');
    if (!error && data && data.length > 0) {
      const mapped: Judge[] = data.map(row => ({
        id: row.id, name: row.name, avatarUrl: row.avatar_url,
        rank: row.rank, email: row.email, active: row.active,
      }));
      ls_set(KEYS.JUDGES, mapped);
      return mapped;
    }
  } catch (e) { console.warn('[api] Supabase error judges:', e); }

  // Fallback con jueces por defecto
  const local = ls_get<Judge>(KEYS.JUDGES);
  if (local.length === 0) {
    const defaults: Judge[] = [
      { id: 'j-hola', name: 'HolaSoyGerman', email: 'lionchan07@gmail.com', avatarUrl: '', rank: 'Director', active: true },
      { id: 'j-rubius', name: 'ElrubiusOMG', email: 'elviaheredia53@gmail.com', avatarUrl: '', rank: 'Juez Regional', active: true },
    ];
    ls_set(KEYS.JUDGES, defaults);
    return defaults;
  }
  return local;
}

export async function createJudge(judge: Partial<Judge>): Promise<boolean> {
  const id = judge.id || `judge-${Date.now()}`;
  const nuevo: Judge = {
    id, name: judge.name || 'Nuevo Juez', email: judge.email,
    avatarUrl: judge.avatarUrl, rank: judge.rank || '1º Dan',
    active: judge.active !== false,
  };
  const list = ls_get<Judge>(KEYS.JUDGES);
  ls_set(KEYS.JUDGES, [...list, nuevo]);

  supabase.from('judges').insert([{
    id, name: nuevo.name, email: nuevo.email,
    avatar_url: nuevo.avatarUrl, rank: nuevo.rank, active: nuevo.active,
  }]).then(({ error }) => { if (error) console.warn('[api] Judge Supabase falló:', error.message); });

  return true;
}

export async function updateJudge(id: string, updates: Partial<Judge>): Promise<boolean> {
  const list = ls_get<Judge>(KEYS.JUDGES);
  ls_set(KEYS.JUDGES, list.map(j => j.id === id ? { ...j, ...updates } : j));

  const payload: any = {};
  if (updates.active !== undefined) payload.active = updates.active;
  if (updates.rank !== undefined) payload.rank = updates.rank;
  if (updates.name !== undefined) payload.name = updates.name;

  supabase.from('judges').update(payload).eq('id', id)
    .then(({ error }) => { if (error) console.warn('[api] update judge Supabase falló:', error.message); });

  return true;
}
