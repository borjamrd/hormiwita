import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgesAchievements } from "./BadgesAchievements";
import { LevelProgression } from "./LevelProgression";
import { ChallengesMissions } from "./ChallengesMissions";
import { Leaderboard } from "./LeaderBoard";

const GamificationContainer = () => {
  return (
    <Tabs defaultValue="insignias" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="insignias">Insignias y Logros</TabsTrigger>
        <TabsTrigger value="niveles">Niveles y Progresión</TabsTrigger>
        <TabsTrigger value="retos">Retos y Misiones</TabsTrigger>
        <TabsTrigger value="clasificaciones">Clasificaciones</TabsTrigger>
      </TabsList>

      <TabsContent value="insignias">
        <BadgesAchievements />
      </TabsContent>
      <TabsContent value="niveles">
        <LevelProgression />
      </TabsContent>
      <TabsContent value="retos">
       <ChallengesMissions />
      </TabsContent>
      <TabsContent value="clasificaciones">
       <Leaderboard />
      </TabsContent>
    </Tabs>
  );
};

export default GamificationContainer;
