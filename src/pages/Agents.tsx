import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Mail, User } from "lucide-react";

export default function Agents() {
  const { profiles, loading } = useProfiles();
  const { profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agentes</h1>
        {isAdmin && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Invitar Agente
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {profiles.map((agent) => (
          <Card key={agent.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
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
                  {agent.id === profile?.id && (
                    <Badge variant="outline">Tú</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}