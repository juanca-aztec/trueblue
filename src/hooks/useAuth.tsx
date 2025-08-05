import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: any; message?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking
          setTimeout(async () => {
            console.log('🔍 Buscando perfil para usuario:', session.user.id, session.user.email);
            
            // First try to find profile by user_id
            let { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            console.log('🎯 Perfil encontrado por user_id:', profile);

            // If no profile found by user_id, try to find by email and update user_id
            if (!profile) {
              console.log('❌ No se encontró perfil por user_id, buscando por email...');
              
              const { data: profileByEmail } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', session.user.email)
                .is('user_id', null)
                .single();

              console.log('📧 Perfil encontrado por email:', profileByEmail);

              if (profileByEmail) {
                console.log('🔄 Actualizando perfil con user_id...');
                
                // Update the profile with the user_id
                const { data: updatedProfile, error: updateError } = await supabase
                  .from('profiles')
                  .update({ user_id: session.user.id })
                  .eq('id', profileByEmail.id)
                  .select()
                  .single();
                
                if (updateError) {
                  console.error('❌ Error actualizando perfil:', updateError);
                } else {
                  console.log('✅ Perfil actualizado exitosamente:', updatedProfile);
                  profile = updatedProfile;
                }
              }
            }
            
            console.log('🏁 Perfil final:', profile);
            setProfile(profile);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `https://trueblu.azteclab.co/auth`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) {
      return { error };
    }
    
    return { 
      error: null, 
      message: 'Se ha enviado un enlace mágico a tu correo electrónico. Revisa tu bandeja de entrada.' 
    };
  };

  const signUp = async (email: string, password: string, name: string, invitationToken?: string) => {
    try {
      const redirectUrl = `https://trueblu.azteclab.co/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signInWithMagicLink,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}