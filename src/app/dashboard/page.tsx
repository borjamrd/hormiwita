"use client";

import { ActionPlan } from "@/components/action-plan";
import { ForecastPosible } from "@/components/charts/ForecastPosible";
import { TopExpensesChart } from "@/components/charts/TopExpensesChart";
import GamificationContainer from "@/components/gamification/GamificationContainer";
import { Objectives } from "@/components/Objectives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useUserStore from "@/store/userStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DashboardPage = () => {
  const userData = useUserStore((state) => state.userData);
  const router = useRouter();

  useEffect(() => {
    if (!userData) {
      router.push("/");
    }
  }, [userData, router]);

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">
          Cargando datos del usuario...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 lg:max-h-[calc(100vh-64px)]">
      <main className="flex-grow container mx-auto p-4 sm:p-4 lg:p-6 flex flex-col overflow-hidden">
        <div className="mb-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              ¡Hola 👋, {userData?.name || "Usuario"}!
            </h2>
            <p className="text-muted-foreground">
              Aquí tienes tu resumen y un plan de acción.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Hormiwicoins</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-full">
              <DialogHeader>
                <DialogTitle>Hormiwicoins</DialogTitle>
              </DialogHeader>
              <GamificationContainer />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 grid-rows-3 lg:grid-cols-5 flex-1 overflow-hidden">
          <div className="col-span-2 lg:col-span-3 col-row-1">
            <ForecastPosible />
          </div>
          <div className="col-span-2 md:row-span-3 h-full">
            <ActionPlan />
          </div>
          <div className="col-span-1 row-span-2">
            <Objectives userData={userData} />
          </div>

          <div className="md:col-span-2 lg:col-span-2 h-full">
            <TopExpensesChart />
          </div>
        </div>
      </main>
      <footer className="bg-card shadow-md mt-auto flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} hormiwita. Todos los derechos
          reservados.
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
