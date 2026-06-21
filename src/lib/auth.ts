import { supabase } from './supabase';

export type UserRoleType = 'aspirante' | 'deportista' | 'admin' | 'tribunal' | 'profesor' | 'juez' | 'arbitro' | 'medico' | null;

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error('Error al iniciar sesión:', error.message);
    throw error;
  }
  return data.session;
}

export async function sendMagicLinkForFirstTime(email: string) {
  // Usaremos OTP Magic Link con shouldCreateUser: true
  // Esto crea el usuario si no existe, o simplemente envía un Magic Link si ya existe.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: window.location.origin + '?type=recovery'
    },
  });
  if (error) {
    console.error('Error enviando enlace mágico:', error.message);
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) {
    console.error('Error actualizando contraseña:', error.message);
    throw error;
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

export async function getUserRoleAndProfile(email: string): Promise<{ role: UserRoleType; profileId?: string }> {
  // Check if admin
  if (email === 'admin@fmk.com' || email === 'admin@fmk.es' || email.startsWith('elvialeonsh')) {
    return { role: 'admin' };
  }

  // Check if Médico Federativo
  if (email === 'paginasusar@gmail.com') {
    return { role: 'medico' };
  }

  // Check if Judge/Tribunal/Arbitro
  const { data: judgeData } = await supabase
    .from('judges')
    .select('*')
    .ilike('email', email)
    .single();

  if (judgeData) {
    if (judgeData.rank?.toLowerCase().includes('juez')) {
      return { role: 'juez', profileId: judgeData.id };
    }
    if (judgeData.rank?.toLowerCase().includes('arbitro') || judgeData.rank?.toLowerCase().includes('árbitro')) {
      return { role: 'arbitro', profileId: judgeData.id };
    }
    if (judgeData.rank?.toLowerCase().includes('tribunal') || judgeData.rank?.toLowerCase().includes('director')) {
      return { role: 'tribunal', profileId: judgeData.id };
    }
    return { role: 'juez', profileId: judgeData.id };
  }

  // Check if Aspirante/Deportista
  const { data: aspData } = await supabase
    .from('aspirantes')
    .select('*')
    .ilike('email', email)
    .single();

  if (aspData) {
    if (aspData.status === 'Borrador' || aspData.status === 'Pendiente') {
      return { role: 'deportista', profileId: aspData.id };
    } else {
      return { role: 'aspirante', profileId: aspData.id };
    }
  }

  // Default
  return { role: 'deportista' }; 
}
