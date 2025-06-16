// components/ChallengesMissions.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type ChallengeType = 'active' | 'completed' | 'available';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  progress: number;
  target: number;
  reward: string;
}


// Datos de ejemplo para los retos
const userChallenges: Challenge[] = [
  {
    id: "no-coffee-week",
    name: "Semana sin café de la calle",
    description: "Evita comprar café en cafeterías durante 7 días. ¡Prepara el tuyo en casa!",
    type: "active",
    progress: 3,
    target: 7,
    reward: "50 EXP + Insignia 'Café Casero'",
  },
  {
    id: "identify-3-ants",
    name: "Identifica 3 Hormigas",
    description: "Encuentra y registra al menos 3 gastos hormiga no categorizados hoy.",
    type: "available",
    progress: 0,
    target: 3,
    reward: "20 EXP",
  },
  {
    id: "budget-adherence-month",
    name: "Mes de Presupuesto Perfecto",
    description: "Mantente dentro de tu presupuesto de gastos hormiga durante un mes completo.",
    type: "completed",
    progress: 1,
    target: 1,
    reward: "200 EXP + Insignia 'Maestro del Presupuesto'",
  },
  {
    id: "no-impulse-buy",
    name: "Día Sin Compras Impulsivas",
    description: "No realices ninguna compra no planificada durante 24 horas.",
    type: "active",
    progress: 0,
    target: 1,
    reward: "30 EXP",
  },
  {
    id: "save-10-percent",
    name: "10% de Ahorro Extra",
    description: "Ahorra un 10% adicional de tu presupuesto de gastos hormiga esta semana.",
    type: "available",
    progress: 0,
    target: 1,
    reward: "75 EXP + Insignia 'Ahorrador Ágil'",
  },
];

export function ChallengesMissions() {
  const activeChallenges: Challenge[] = userChallenges.filter(c => c.type === "active");
  const completedChallenges: Challenge[] = userChallenges.filter(c => c.type === "completed");
  const availableChallenges: Challenge[] = userChallenges.filter(c => c.type === "available");

  const handleCompleteChallenge = (challengeId: string) => {
    console.log(`Completar reto: ${challengeId}`);
    alert(`¡Reto ${challengeId} completado! (Lógica pendiente de implementación)`);
  };

  const handleStartChallenge = (challengeId: string) => {
    console.log(`Iniciar reto: ${challengeId}`);
    alert(`¡Reto ${challengeId} iniciado! (Lógica pendiente de implementación)`);
  };

  const getStatusIcon = (type: ChallengeType) => {
    switch (type) {
      case 'active': return <Clock className="w-4 h-4 text-primary" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case 'available': return <XCircle className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const renderChallengeCard = (challenge: Challenge) => (
    <Card key={challenge.id} className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {challenge.name}
          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
            Recompensa: {challenge.reward}
          </Badge>
        </CardTitle>
        {getStatusIcon(challenge.type)}
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">{challenge.description}</CardDescription>
        {challenge.type === "active" && (
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span>Progreso: {challenge.progress} / {challenge.target}</span>
            <Button size="sm" onClick={() => handleCompleteChallenge(challenge.id)}>
              Marcar como Completado
            </Button>
          </div>
        )}
        {challenge.type === "available" && (
          <Button size="sm" onClick={() => handleStartChallenge(challenge.id)} className="mt-2">
            Empezar Reto</Button>
        )}
        {challenge.type === "completed" && (
          <Badge className="bg-accent text-white mt-2 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Completado
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-primary">Retos y Misiones</CardTitle>
        <CardDescription>
          Supera desafíos diarios y semanales para potenciar tu ahorro y ganar recompensas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-white z-10 border-b">
            <TabsTrigger value="active">Activos ({activeChallenges.length})</TabsTrigger>
            <TabsTrigger value="completed">Completados ({completedChallenges.length})</TabsTrigger>
            <TabsTrigger value="available">Disponibles ({availableChallenges.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            {activeChallenges.length > 0 ? (
              activeChallenges.map(renderChallengeCard)
            ) : (
              <p className="text-center text-gray-500">No tienes retos activos en este momento.</p>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {completedChallenges.length > 0 ? (
              completedChallenges.map(renderChallengeCard)
            ) : (
              <p className="text-center text-gray-500">Aún no has completado ningún reto.</p>
            )}
          </TabsContent>
          <TabsContent value="available" className="mt-4">
            {availableChallenges.length > 0 ? (
              availableChallenges.map(renderChallengeCard)
            ) : (
              <p className="text-center text-gray-500">No hay nuevos retos disponibles por ahora. ¡Vuelve pronto!</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}