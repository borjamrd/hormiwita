// components/Leaderboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, Gem } from "lucide-react"; // Iconos para los puestos principales

// types/leaderboard.d.ts
export interface LeaderboardUser {
  id: string;
  name: string;
  points: number; // Podrían ser puntos de experiencia, dinero ahorrado, etc.
  avatarUrl?: string; // Opcional, para la imagen del usuario
}

// Datos de ejemplo para la clasificación
const leaderboardData: LeaderboardUser[] = [
  {
    id: "user2",
    name: "Borja M.",
    points: 5200,
    avatarUrl: "https://api.dicebear.com/7.x/lorelei/svg?seed=Carlos",
  },
  {
    id: "user1",
    name: "Ana P.",
    points: 4900,
    avatarUrl: "https://github.com/shadcn.png",
  },
  {
    id: "user3",
    name: "Sofía M.",
    points: 4100,
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sofia",
  },
  {
    id: "user4",
    name: "David L.",
    points: 3500,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=David",
  },
  {
    id: "user5",
    name: "Elena R.",
    points: 3000,
    avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=Elena",
  },
  { id: "user6", name: "Fran J.", points: 2700 },
  { id: "user7", name: "Gema V.", points: 2100 },
  { id: "user8", name: "Hugo P.", points: 1900 },
  // ... más usuarios
];

const currentUserId: string = "user2"; 

export function Leaderboard() {
  const sortedLeaderboard = [...leaderboardData].sort(
    (a, b) => b.points - a.points
  );
  const currentUserRank =
    sortedLeaderboard.findIndex((user) => user.id === currentUserId) + 1; 

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-primary text-2xl">
          Clasificación de Hormiwita
        </CardTitle>
        <CardDescription>
          ¡Compite amistosamente y ve quién es el mayor ahorrador!
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {/* Top 3 Destacado */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {sortedLeaderboard.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className={`flex flex-col items-center p-3 rounded-lg shadow-sm
                          ${
                            index === 0
                              ? "bg-gradient-to-br from-yellow-200 to-yellow-400 border border-yellow-500"
                              : ""
                          }
                          ${
                            index === 1
                              ? "bg-gradient-to-br from-gray-200 to-gray-400 border border-gray-500"
                              : ""
                          }
                          ${
                            index === 2
                              ? "bg-gradient-to-br from-orange-200 to-orange-400 border border-orange-500"
                              : ""
                          }
                          relative overflow-hidden
                          `}
            >
              {index === 0 && (
                <Crown className="absolute -top-2 -right-2 w-8 h-8 text-yellow-600 opacity-70 rotate-12" />
              )}
              {index === 1 && (
                <Trophy className="absolute -top-2 -right-2 w-7 h-7 text-gray-600 opacity-70 rotate-12" />
              )}
              {index === 2 && (
                <Gem className="absolute -top-2 -right-2 w-7 h-7 text-orange-600 opacity-70 rotate-12" />
              )}

              <Avatar className="w-16 h-16 mb-2 border-2 border-white">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-bold text-lg text-gray-800">
                #{index + 1}
              </span>
              <p className="text-sm font-medium text-gray-700 truncate w-full px-1 text-center">
                {user.name}
              </p>
              <p className="text-xs text-gray-600">{user.points} pts</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {sortedLeaderboard.slice(0, 10).map(
            (
              user,
              index 
            ) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-3 rounded-lg
                          ${
                            user.id === currentUserId
                              ? "bg-accent/10 border border-accent"
                              : "bg-gray-50 border border-gray-100"
                          }
                          ${
                            index < 3 ? "hidden sm:flex" : ""
                          }  // Oculta los primeros 3 en móvil si se muestran arriba
                          `}
              >
                <span
                  className={`font-bold text-lg w-8 text-center ${
                    user.id === currentUserId ? "text-accent" : "text-gray-700"
                  }`}
                >
                  #{index + 1}
                </span>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span
                  className={`flex-1 font-medium ${
                    user.id === currentUserId ? "text-accent" : "text-gray-800"
                  }`}
                >
                  {user.name}
                </span>
                <span
                  className={`font-semibold ${
                    user.id === currentUserId ? "text-accent" : "text-gray-700"
                  }`}
                >
                  {user.points} pts
                </span>
              </div>
            )
          )}

          {currentUserId &&
            currentUserRank > 10 && (
              <>
                <p className="text-center text-gray-500 text-sm mt-4">...</p>
                <div
                  className={`flex items-center gap-4 p-3 rounded-lg bg-accent/10 border border-accent`}
                >
                  <span className="font-bold text-lg w-8 text-center text-accent">
                    #{currentUserRank}
                  </span>
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={
                        leaderboardData.find((u) => u.id === currentUserId)
                          ?.avatarUrl
                      }
                      alt={
                        leaderboardData.find((u) => u.id === currentUserId)
                          ?.name
                      }
                    />
                    <AvatarFallback>
                      {leaderboardData
                        .find((u) => u.id === currentUserId)
                        ?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium text-accent">
                    {leaderboardData.find((u) => u.id === currentUserId)?.name}{" "}
                    (Tú)
                  </span>
                  <span className="font-semibold text-accent">
                    {
                      leaderboardData.find((u) => u.id === currentUserId)
                        ?.points
                    }{" "}
                    pts
                  </span>
                </div>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
