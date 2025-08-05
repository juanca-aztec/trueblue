import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MessageSquare, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isInvitationFlow, setIsInvitationFlow] = useState(false);
  const { signInWithMagicLink, signUp, user } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');
    
    if (token && emailParam) {
      setIsInvitationFlow(true);
      setInvitationToken(token);
      setEmail(decodeURIComponent(emailParam));
      // Validate the invitation token
      validateInvitationToken(token, decodeURIComponent(emailParam));
    }
  }, []);

  const validateInvitationToken = async (token: string, email: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_invitation_token', {
        token_input: token,
        email_input: email
      });

      if (error || !data) {
        setError('El token de invitación es inválido o ha expirado.');
        setIsInvitationFlow(false);
        return;
      }

      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .single();

      if (inviteError || !invitation) {
        setError('No se pudo cargar la información de la invitación.');
        return;
      }

      setInvitationData(invitation);
    } catch (error: any) {
      setError('Error al validar la invitación.');
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { error, message } = await signInWithMagicLink(email);
    
    if (error) {
      setError(error.message || 'Error al enviar el enlace mágico');
    } else if (message) {
      setSuccess(message);
      setEmail(''); // Clear email after successful send
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signUp(email, password, name);
    
    if (error) {
      setError(error.message || 'Error al registrarse');
    } else {
      setError('');
      // Show success message or redirect
    }
    
    setLoading(false);
  };

  const handleInvitationSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!invitationData) {
      setError('Datos de invitación no encontrados.');
      setLoading(false);
      return;
    }

    try {
      // Sign up the user
      const { error } = await signUp(email, password, name || invitationData.role);
      
      if (error) {
        setError(error.message || 'Error al registrarse');
      } else {
        // Mark invitation as used
        await supabase.rpc('use_invitation_token', {
          token_input: invitationToken,
          email_input: email
        });
        
        setSuccess('¡Cuenta creada exitosamente! Ya puedes acceder al sistema.');
      }
    } catch (error: any) {
      setError('Error al procesar la invitación.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Chat Management</CardTitle>
          <CardDescription>
            Accede al sistema de gestión de conversaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInvitationFlow && invitationData ? (
            <>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invitación Recibida</AlertTitle>
                <AlertDescription>
                  Has sido invitado como <strong>{invitationData.role}</strong>. Completa tu registro para acceder al sistema.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleInvitationSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Elige una contraseña segura"
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Completar Registro'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso por Invitación</AlertTitle>
                <AlertDescription>
                  Solo los usuarios invitados por un administrador pueden acceder al sistema. Ingresa tu email para recibir un enlace de acceso seguro.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-email@ejemplo.com"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando enlace...' : 'Enviar Enlace Mágico'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}