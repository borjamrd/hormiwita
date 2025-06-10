"use client";

import { ActionPlan } from "@/components/action-plan"; // Import ActionPlan
import { TopExpensesChart } from "@/components/charts/TopExpensesChart";
import { Objectives } from "@/components/Objectives"; // Import Objectives
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
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {" "}
      {/* Use h-screen and overflow-hidden on root */}
      {/* Main Content Area */}
      {/* flex-grow allows this section to take available space, flex flex-col for internal layout, overflow-hidden to prevent it from causing page scroll */}
      <main className="flex-grow container mx-auto p-4 sm:p-4 lg:p-6 flex flex-col overflow-hidden">
        <div className="mb-4 flex-shrink-0">
          {" "}
          {/* Welcome message, should not grow or shrink */}
          <h2 className="text-3xl font-bold text-foreground">
            ¡Hola 👋, {userData?.name || "Usuario"}!
          </h2>
          <p className="text-muted-foreground">
            Aquí tienes tu resumen y un plan de acción.
          </p>
        </div>

        {/* Grid container: flex-1 allows it to take remaining vertical space in the flex-col main */}
        {/* lg:grid-rows-[auto_minmax(0,1fr)] helps define row heights for multi-row spans */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 flex-1 lg:grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
          {/* Objectives Card - ensure it can fit its content or scroll internally if needed */}
          <div className="lg:col-start-1 lg:row-start-1 h-full">
            {" "}
            {/* Explicit placement and h-full */}
            <Objectives userData={userData} />
          </div>

          {/* Placeholder Card */}
          <div className="bg-card p-6 rounded-lg shadow h-full lg:col-start-2 lg:row-start-1">
            {" "}
            {/* Explicit placement and h-full */}
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Próximamente...
            </h3>
            <p className="text-muted-foreground">
              Más análisis y herramientas estarán disponibles aquí.
            </p>
            <div className="mt-4 space-y-2">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
            </div>
          </div>

          {/* TopExpensesChart Card */}
          {/* md:col-span-2 and lg:col-span-2 as per your layout. h-full to fill grid cell. */}
          <div className="md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-2 h-full">
            {" "}
            {/* Explicit placement and h-full */}
            <TopExpensesChart />
          </div>

          {/* ActionPlan Card - col-span-1 and row-span-2 to take up significant vertical space */}
          {/* h-full ensures it fills the height of the two rows it spans */}
          <div className="col-span-1 md:col-start-3 md:row-start-1 md:row-span-2 lg:col-start-3 lg:row-start-1 lg:row-span-2 h-full">
            {" "}
            {/* Explicit placement and h-full */}
            <ActionPlan />
          </div>
        </div>
      </main>
      {/* Footer - flex-shrink-0 to prevent footer from shrinking */}
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
