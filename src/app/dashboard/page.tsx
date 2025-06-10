"use client";

import { ActionPlan } from "@/components/action-plan";
import { TopExpensesChart } from "@/components/charts/TopExpensesChart";
import { Objectives } from "@/components/Objectives";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const handleLogout = () => {
    useUserStore.getState().setUserData(null);
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 lg:max-h-[calc(100vh-64px)]">
      <main className="flex-grow container mx-auto p-4 sm:p-4 lg:p-6 flex flex-col overflow-hidden">
        <div className="mb-4 flex-shrink-0">
          <h2 className="text-3xl font-bold text-foreground">
            ¡Hola 👋, {userData?.name || "Usuario"}!
          </h2>
          <p className="text-muted-foreground">
            Aquí tienes tu resumen y un plan de acción.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 flex-1 overflow-hidden">
          <div className="h-full">
            <Objectives userData={userData} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximamente...</CardTitle>
              <CardDescription>
                Más análisis y herramientas estarán disponibles aquí.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
              </div>
            </CardContent>
          </Card>
          <div className="col-span-1 md:row-span-2 h-full">
            <ActionPlan />
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
