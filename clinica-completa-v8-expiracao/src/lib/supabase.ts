import { createClient, type User } from "@supabase/supabase-js";

// Credenciais públicas (protegidas por RLS no banco — não são segredo, como a chave do Firebase antes)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY não configuradas. Configure o .env local ou as variáveis de ambiente na Vercel."
  );
}

// O schema whatsapp_ia isola este produto de outros que compartilham o mesmo projeto Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: "whatsapp_ia" },
  auth: { persistSession: true, autoRefreshToken: true },
});

export type StaffRole = "admin" | "doctor" | "receptionist";

export interface StaffProfile {
  id: string;
  authUserId: string | null;
  name: string;
  email: string;
  role: StaffRole;
  doctorId?: string | null;
  doctorName?: string | null;
  crm?: string | null;
  specialty?: string | null;
  phone?: string | null;
  status: "active" | "inactive";
  avatarUrl?: string | null;
  lastLogin?: string | null;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Login falhou: usuário não retornado.");
  return data.user;
}

/**
 * Substitui o antigo loginWithGoogle do Firebase. Requer o provedor Google
 * habilitado em Supabase Dashboard > Authentication > Providers.
 */
export async function loginWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Alias mantido para compatibilidade com componentes que importavam `auth` do firebase.ts
export const auth = supabase.auth;

/**
 * Busca o perfil de equipe (papel/role) vinculado ao usuário autenticado.
 * Retorna null se o usuário logado não estiver cadastrado como equipe ativa —
 * nesse caso o acesso deve ser negado na UI, e o RLS já bloqueia no banco de qualquer forma.
 */
export async function fetchStaffProfile(authUserId: string): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from("clinic_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar perfil de equipe:", error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    email: data.email,
    role: data.role,
    doctorId: data.doctor_id,
    doctorName: data.doctor_name,
    crm: data.crm,
    specialty: data.specialty,
    phone: data.phone,
    status: data.status,
    avatarUrl: data.avatar_url,
    lastLogin: data.last_login,
  };
}
