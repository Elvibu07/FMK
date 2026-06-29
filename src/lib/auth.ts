import { signInWithEmailAndPassword, sendSignInLinkToEmail, updatePassword as firebaseUpdatePassword, signOut as firebaseSignOut, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from './firebase';

export type UserRoleType = 'aspirante' | 'deportista' | 'admin' | 'tribunal' | 'director' | 'juez' | 'arbitro' | 'medico' | null;

export async function checkAndApplyMagicLink() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Por favor, confirma tu correo electrónico para acceder:');
    }
    if (email) {
      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        return result.user;
      } catch (err) {
        console.error('Error signing in with email link:', err);
      }
    }
  }
  return null;
}

export async function signInWithPassword(email: string, password: string) {
  // 1. Intentar iniciar sesión en Supabase
  try {
    const { supabase } = await import("./supabase");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      console.log("✅ Inicio de sesión exitoso en Supabase:", data.user.email);
      return {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.full_name || '',
        photoURL: data.user.user_metadata?.avatar_url || ''
      };
    }
  } catch (supabaseError) {
    console.warn("⚠️ Fallo en inicio de sesión de Supabase, intentando Firebase...", supabaseError);
  }

  // 2. Fallback: Intentar iniciar sesión en Firebase
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Obtener rol y asegurar que el perfil exista
    const { role } = await getUserRoleAndProfile(email);
    if (role) {
      const { ensureProfileExists } = await import("./firestore");
      await ensureProfileExists(role as any, user.uid, email);
    }
    return user;
  } catch (error: any) {
    console.error('Error al iniciar sesión en Firebase:', error.message);
    throw error;
  }
}

export async function sendMagicLinkForFirstTime(email: string, name?: string, role?: string) {
  const currentDomain = window.location.origin;
  const actionCodeSettings = {
    url: `${currentDomain}?type=recovery`,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  } catch (error: any) {
    console.error('Error enviando enlace mágico en Firebase:', error.message);
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  if (auth.currentUser) {
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      return true;
    } catch (error: any) {
      console.error('Error actualizando contraseña:', error.message);
      throw error;
    }
  }
  throw new Error('No hay usuario autenticado');
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase sign out exception:', err);
  }
}

export async function getUserRoleAndProfile(email: string): Promise<{ role: UserRoleType; profileId?: string }> {
  const emailLower = email.toLowerCase().trim();

  try {
    // 1. Intentar consultar la coleccion user_roles en Firebase (Staff)
    const qRole = query(collection(db, "user_roles"), where("email", "==", emailLower));
    const roleSnapshot = await getDocs(qRole);

    if (!roleSnapshot.empty) {
      const roleData = roleSnapshot.docs[0].data();
      console.log(`[auth] Rol encontrado en Firebase (user_roles) para ${emailLower}:`, roleData.rol);
      return {
        role: roleData.rol as UserRoleType
      };
    }

    // 2. Si no es staff, buscar en la coleccion aspirantes
    const qAsp = query(collection(db, "aspirantes_demo"), where("email", "==", emailLower));
    const aspSnapshot = await getDocs(qAsp);

    if (!aspSnapshot.empty) {
      const aspData = aspSnapshot.docs[0];
      console.log(`[auth] Estudiante encontrado en tabla aspirantes para ${emailLower}`);
      return {
        role: 'deportista',
        profileId: aspData.id
      };
    }
  } catch (e) {
    console.error('[auth] Excepción al consultar Firebase:', e);
  }

  // 3. SISTEMA DE RESPALDO GARANTIZADO (FALLBACK HARDCODEADO)
  console.warn(`[auth] Usando sistema de respaldo local para ${emailLower}...`);
  
  if (emailLower.includes('director')) return { role: 'director' };
  if (emailLower.includes('admin')) return { role: 'admin' };
  if (emailLower.includes('juez')) return { role: 'juez' };
  if (emailLower.includes('medico')) return { role: 'medico' };
  if (emailLower.includes('arbitro')) return { role: 'arbitro' };

  if (emailLower === 'lionchan07@gmail.com') return { role: 'director' };
  if (emailLower === 'elvialeonsh@gmail.com') return { role: 'admin' };
  if (emailLower === 'elviaheredia53@gmail.com') return { role: 'juez' };
  if (emailLower === 'paginasusar@gmail.com') return { role: 'medico' };
  if (emailLower === 'arbitro@gmail.com') return { role: 'arbitro' };

  // 4. Si no está en Firebase ni en el respaldo, asumir nuevo estudiante (Deportista por defecto)
  console.warn(`[auth] No se encontró rol para ${emailLower}. Rol por defecto: deportista`);
  return { role: 'deportista' };
}
