import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { Profile } from "@/types/database";
import { Plus, Mail, User, Edit, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AgentManagement() {
  const { profiles, loading, createInvitation, updateProfile } = useProfiles();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Profile | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent');
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'agent'>('agent');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const handleInviteAgent = async () => {
    if (!inviteEmail) return;
    
    await createInvitation(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('agent');
    setIsInviteOpen(false);
  };

  const handleEditAgent = (agent: Profile) => {
    setSelectedAgent(agent);
    setEditName(agent.name);
    setEditRole(agent.role as 'admin' | 'agent');
    setIsEditOpen(true);
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    
    await updateProfile(selectedAgent.id, {
      name: editName,
      role: editRole
    });
    setIsEditOpen(false);
    setSelectedAgent(null);
  };

  const handleToggleStatus = async (agent: Profile) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    await updateProfile(agent.id, { status: newStatus });
    
    toast({
      title: "Estado actualizado",
      description: `El agente ${agent.name} ahora está ${newStatus === 'active' ? 'activo' : 'inactivo'}`,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Agentes</h1>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invitar Agente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Agente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="agente@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Rol</Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'agent') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInviteAgent} className="flex-1">
                  Enviar Invitación
                </Button>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {profiles.map((agent) => (
          <Card key={agent.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    agent.status === 'active' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <User className={`h-5 w-5 ${
                      agent.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {agent.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={agent.role === 'admin' ? 'default' : 'secondary'}>
                    {agent.role === 'admin' ? 'Administrador' : 'Agente'}
                  </Badge>
                  
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                  
                  {agent.id === profile?.id && (
                    <Badge variant="outline">Tú</Badge>
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    {agent.id !== profile?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(agent)}
                      >
                        {agent.status === 'active' ? (
                          <UserX className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={editRole} onValueChange={(value: 'admin' | 'agent') => setEditRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateAgent} className="flex-1">
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}