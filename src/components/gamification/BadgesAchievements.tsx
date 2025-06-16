import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, CircleDashed } from "lucide-react"; 

const allBadges = [
  {
    id: "saver-rookie",
    name: "Ahorrador Novato",
    description: "Has registrado tus primeros 7 días de gastos hormiga.",
    icon: "/path/to/saver-rookie-icon.png",
    unlocked: true, 
  },
  {
    id: "budget-master",
    name: "Maestro del Presupuesto",
    description: "Has cumplido tu presupuesto de gastos hormiga durante un mes completo.",
    icon: "/path/to/budget-master-icon.png",
    unlocked: false,
  },
  {
    id: "ant-eliminator",
    name: "Eliminador de Hormigas",
    description: "Has reducido tus gastos hormiga en un 20% en un trimestre.",
    icon: "/path/to/ant-eliminator-icon.png",
    unlocked: true,
  },
  {
    id: "seven-day-streak",
    name: "Racha de 7 Días",
    description: "Has registrado gastos diariamente durante 7 días consecutivos.",
    icon: "/path/to/seven-day-streak-icon.png",
    unlocked: false,
  },
  {
    id: "goal-achiever",
    name: "Conquistador de Metas",
    description: "Has alcanzado tu primer objetivo de ahorro significativo.",
    icon: "/path/to/goal-achiever-icon.png",
    unlocked: true,
  },
];

export function BadgesAchievements() {
  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-primary">Tus insignias y logros</CardTitle>
        <CardDescription>
          ¡Cada pequeña victoria cuenta! Descubre las insignias que has obtenido y las que te esperan.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
        <TooltipProvider>
          {allBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center text-center cursor-pointer">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-2
                                ${badge.unlocked ? 'border-accent bg-gradient-to-br from-accent/20 to-primary/10' : 'border-gray-300 bg-gray-100 opacity-60 grayscale'}`}
                  >
                    {badge.unlocked ? (
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    ) : (
                      <CircleDashed className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <Badge
                    variant={badge.unlocked ? "default" : "secondary"}
                    className={`mt-2 ${badge.unlocked ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {badge.name}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-sm">{badge.description}</p>
                {badge.unlocked ? (
                  <p className="text-xs text-accent mt-1">¡Desbloqueada!</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Pendiente</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}