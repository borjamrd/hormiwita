// components/LevelProgression.jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, Sparkles } from "lucide-react"; // Iconos para recompensas

// Define la estructura de tus niveles.
// En una aplicación real, 'currentExperience' y 'userLevel' vendrían del estado del usuario o una API.
const userCurrentExperience = 750; // Ejemplo de puntos de experiencia del usuario
const userLevel = 2; // Ejemplo del nivel actual del usuario

const levels = [
  {
    level: 1,
    name: "Hormiga Obrera",
    expRequired: 0,
    rewards: ["Acceso a seguimiento básico", "Insignia 'Primeros Pasos'"],
  },
  {
    level: 2,
    name: "Recolectora eficiente",
    expRequired: 500,
    rewards: ["Visualización de gráficos semanales", "Recompensa virtual: comida para tu hormiwita"],
  },
  {
    level: 3,
    name: "Arquitecta del Hormiguero",
    expRequired: 1500,
    rewards: ["Desbloquea objetivos de ahorro personalizados", "Insignia 'Maestro del Gasto'"],
  },
  {
    level: 4,
    name: "Líder de Expedición",
    expRequired: 3000,
    rewards: ["Acceso a retos avanzados", "Personalización de la interfaz"],
  },
  {
    level: 5,
    name: "Hormiga Reina del Ahorro",
    expRequired: 5000,
    rewards: ["Acceso a funciones premium", "Insignia 'Leyenda del Ahorro'", "Recompensa final épica"],
  },
];

export function LevelProgression() {
  const currentLevelData = levels.find(level => level.level === userLevel) || levels[0]; 
  const nextLevelData = levels.find(level => level.level === userLevel + 1) ;
  let progressPercentage = 0;
  let expToNextLevel = 0;

  if (nextLevelData) {
    const expGainedInCurrentLevel = userCurrentExperience - currentLevelData.expRequired;
    const expNeededForNextLevel = nextLevelData.expRequired - currentLevelData.expRequired;
    progressPercentage = (expGainedInCurrentLevel / expNeededForNextLevel) * 100;
    expToNextLevel = nextLevelData.expRequired - userCurrentExperience;
  } else {
    progressPercentage = 100;
    expToNextLevel = 0;
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-primary">Niveles de ahorro</CardTitle>
        <CardDescription>
          ¡Sube de nivel tu Hormiwita y desbloquea nuevas recompensas mientras ahorras!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Tu Nivel Actual</p>
            <h3 className="text-2xl font-bold text-accent">{currentLevelData?.name || "Nivel Desconocido"}</h3>
            <p className="text-sm text-gray-500">Exp: {userCurrentExperience}</p>
          </div>
          {nextLevelData && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Próximo Nivel: {nextLevelData.name}</p>
              <p className="text-sm text-gray-500">{expToNextLevel} EXP para alcanzarlo</p>
            </div>
          )}
        </div>

        <Progress value={progressPercentage} className="w-full h-3 mb-6 bg-gray-200" />

        <Separator className="my-6" />

        <h4 className="text-lg font-semibold mb-4 text-primary">Todos los Niveles</h4>
        <div className="space-y-4">
          {levels.map((levelItem) => (
            <div key={levelItem.level} className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                            ${userLevel >= levelItem.level ? 'bg-accent text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                {levelItem.level}
              </div>
              <div>
                <h5 className="font-semibold text-base">
                  {levelItem.name} {userLevel === levelItem.level && <Badge className="ml-2 bg-primary">Actual</Badge>}
                </h5>
                <p className="text-sm text-muted-foreground">
                  Necesitas {levelItem.expRequired} EXP
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {levelItem.rewards.map((reward, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-300">
                      {/* Puedes usar diferentes iconos según el tipo de recompensa */}
                      {reward.includes("Insignia") && <Trophy className="w-3 h-3" />}
                      {reward.includes("Acceso") && <Shield className="w-3 h-3" />}
                      {reward.includes("Personalización") && <Sparkles className="w-3 h-3" />}
                      {reward}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}