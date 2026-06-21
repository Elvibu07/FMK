import { supabase } from './supabase';
import { Aspirante, Convocatoria, Judge, Tribunal, Documento } from '../types';

// ==========================================
// CONSTANTES DE ALMACENAMIENTO LOCAL
// ==========================================
const STORAGE_KEYS = {
  ASPIRANTES: 'fmk_aspirantes_local',
  CONVOCATORIAS: 'fmk_convocatorias_local',
  TRIBUNALES: 'fmk_tribunales_local',
  JUDGES: 'fmk_judges_local'
};

// Funciones de ayuda genéricas para Local Storage
function getFromStorage<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
    return false;
  }
}

// ==========================================
// ASPIRANTES (Local Storage Fallback)
// ==========================================
export async function fetchAspirantes(): Promise<Aspirante[]> {
  const aspirantes = getFromStorage<Aspirante>(STORAGE_KEYS.ASPIRANTES);
  
  // Eliminar duplicados (causados por el bug anterior)
  const uniqueAspirantes = Array.from(new Map(aspirantes.map(a => [a.id, a])).values());
  
  // Si había duplicados, limpiamos el localStorage guardando la versión corregida
  if (uniqueAspirantes.length < aspirantes.length) {
    saveToStorage(STORAGE_KEYS.ASPIRANTES, uniqueAspirantes);
  }
  
  // Asegurar que tengan estructura de documentos válida para evitar crashes
  return uniqueAspirantes.map(a => ({
    ...a,
    documents: a.documents || {
      dni: { name: '', uploaded: false },
      photo: { name: '', uploaded: false },
      license: { name: '', uploaded: false },
    },
    documentos: a.documentos || []
  }));
}

export async function createAspirante(aspirante: Partial<Aspirante>): Promise<boolean> {
  const list = getFromStorage<Aspirante>(STORAGE_KEYS.ASPIRANTES);
  const nueva: Aspirante = {
    id: aspirante.id || `asp-${Date.now()}`,
    name: aspirante.name || 'Sin Nombre',
    email: aspirante.email || '',
    club: aspirante.club || '',
    estilo: aspirante.estilo || 'Shotokan',
    avatarUrl: aspirante.avatarUrl,
    currentBelt: aspirante.currentBelt || '',
    requestedBelt: aspirante.requestedBelt || '',
    fechaUltimoGrado: aspirante.fechaUltimoGrado,
    licenciasAcumuladas: aspirante.licenciasAcumuladas || 0,
    licenciasConsecutivas: aspirante.licenciasConsecutivas || 0,
    status: aspirante.status || 'Borrador',
    progressStep: aspirante.progressStep || 1,
    paymentStatus: aspirante.paymentStatus || 'Unpaid',
    birthDate: aspirante.birthDate,
    documents: {
      dni: { name: '', uploaded: false },
      photo: { name: '', uploaded: false },
      license: { name: '', uploaded: false },
    },
    documentos: []
  };
  
  list.unshift(nueva); // Agregar al principio
  return saveToStorage(STORAGE_KEYS.ASPIRANTES, list);
}

export async function updateAspirante(id: string, updates: Partial<Aspirante>): Promise<boolean> {
  const list = getFromStorage<Aspirante>(STORAGE_KEYS.ASPIRANTES);
  const updatedList = list.map(a => a.id === id ? { ...a, ...updates } : a);
  return saveToStorage(STORAGE_KEYS.ASPIRANTES, updatedList);
}

// ==========================================
// CONVOCATORIAS (Local Storage Fallback)
// ==========================================
export async function fetchConvocatorias(): Promise<Convocatoria[]> {
  return getFromStorage<Convocatoria>(STORAGE_KEYS.CONVOCATORIAS);
}

export async function updateConvocatoria(id: string, updates: Partial<Convocatoria>): Promise<boolean> {
  const list = getFromStorage<Convocatoria>(STORAGE_KEYS.CONVOCATORIAS);
  const updatedList = list.map(c => c.id === id ? { ...c, ...updates } : c);
  return saveToStorage(STORAGE_KEYS.CONVOCATORIAS, updatedList);
}

export async function createConvocatoria(convocatoria: Partial<Convocatoria>): Promise<boolean> {
  const list = getFromStorage<Convocatoria>(STORAGE_KEYS.CONVOCATORIAS);
  const nueva = {
    id: convocatoria.id || `conv-${Date.now()}`,
    titulo: convocatoria.titulo || 'Sin Título',
    fecha: convocatoria.fecha || new Date().toISOString(),
    sede: convocatoria.sede || '',
    gradesAdmitidos: convocatoria.gradesAdmitidos || [],
    plazoOrdinario: convocatoria.plazoOrdinario || new Date().toISOString(),
    estado: convocatoria.estado || 'Borrador',
    cupoMaximo: convocatoria.cupoMaximo || 40,
    inscritos: convocatoria.inscritos || 0,
    observaciones: convocatoria.observaciones || ''
  } as Convocatoria;

  list.push(nueva);
  const success = saveToStorage(STORAGE_KEYS.CONVOCATORIAS, list);
  if (!success) alert('Error guardando en el almacenamiento local.');
  return success;
}

// ==========================================
// TRIBUNALES (Local Storage Fallback)
// ==========================================
export async function fetchTribunals(): Promise<Tribunal[]> {
  return getFromStorage<Tribunal>(STORAGE_KEYS.TRIBUNALES);
}

export async function updateTribunal(id: string, updates: Partial<Tribunal>): Promise<boolean> {
  const list = getFromStorage<Tribunal>(STORAGE_KEYS.TRIBUNALES);
  const updatedList = list.map(t => t.id === id ? { ...t, ...updates } : t);
  return saveToStorage(STORAGE_KEYS.TRIBUNALES, updatedList);
}

export async function createTribunal(tribunal: Partial<Tribunal>): Promise<boolean> {
  const list = getFromStorage<Tribunal>(STORAGE_KEYS.TRIBUNALES);
  const nueva: Tribunal = {
    id: tribunal.id || `trib-${Date.now()}`,
    name: tribunal.name || 'Nuevo Tribunal',
    isMain: tribunal.isMain || false,
    convocatoriaId: tribunal.convocatoriaId,
    judges: tribunal.judges || []
  };
  
  list.push(nueva);
  return saveToStorage(STORAGE_KEYS.TRIBUNALES, list);
}

// ==========================================
// JUDGES (Local Storage Fallback)
// ==========================================
export async function fetchJudges(): Promise<Judge[]> {
  const judges = getFromStorage<Judge>(STORAGE_KEYS.JUDGES);
  if (judges.length === 0) {
    // Restaurar los jueces antiguos de Supabase que el usuario pidió
    const defaultJudges: Judge[] = [
      { id: 'j-hola', name: 'HolaSoyGerman', email: 'lionchan07@gmail.com', avatarUrl: '', rank: 'Director', active: true },
      { id: 'j-rubius', name: 'ElrubiusOMG', email: 'elviaheredia53@gmail.com', avatarUrl: '', rank: 'Juez Regional', active: true }
    ];
    saveToStorage(STORAGE_KEYS.JUDGES, defaultJudges);
    return defaultJudges;
  }
  return judges;
}

export async function updateJudge(id: string, updates: Partial<Judge>): Promise<boolean> {
  const list = getFromStorage<Judge>(STORAGE_KEYS.JUDGES);
  const updatedList = list.map(j => j.id === id ? { ...j, ...updates } : j);
  return saveToStorage(STORAGE_KEYS.JUDGES, updatedList);
}

export async function createJudge(judge: Partial<Judge>): Promise<boolean> {
  const list = getFromStorage<Judge>(STORAGE_KEYS.JUDGES);
  const nueva: Judge = {
    id: judge.id || `judge-${Date.now()}`,
    name: judge.name || 'Nuevo Juez',
    email: judge.email,
    avatarUrl: judge.avatarUrl,
    rank: judge.rank || '1º Dan',
    active: judge.active !== false
  };
  
  list.push(nueva);
  return saveToStorage(STORAGE_KEYS.JUDGES, list);
}
