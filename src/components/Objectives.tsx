'use client';

import type { UserData } from "@/store/userStore";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, CheckCircle, ListChecks } from "lucide-react";

interface ObjectivesProps {
  userData: UserData | null;
}

export function Objectives({ userData }: ObjectivesProps) {
  if (!userData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></CardTitle>
          <CardDescription className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-28"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasGeneralObjectives = userData.generalObjectives && userData.generalObjectives.length > 0;
  const hasSpecificObjectives = userData.specificObjectives && userData.specificObjectives.length > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex">
        <CardTitle className="flex gap-2"> <Target className="h-6 w-6 text-primary mr-3 shrink-0" />Mis Objetivos</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow">
        {!hasGeneralObjectives && !hasSpecificObjectives && (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Aún no has definido tus objetivos financieros.
            </p>
          </div>
        )}

        {hasGeneralObjectives && (
          <div className="mb-4">
            <h4 className="text-md font-medium text-primary mb-2 flex items-center">
              <ListChecks className="h-5 w-5 mr-2" />
              Objetivos Generales
            </h4>
            <div className="flex flex-wrap gap-2">
              {userData.generalObjectives?.map((obj, index) => (
                <Badge
                  key={`gen-${index}`}
                  variant="secondary"
                  className="text-sm px-3 py-1 shadow-sm"
                >
                  {obj}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasSpecificObjectives && (
          <div>
            <h4 className="text-md font-medium text-primary mb-2 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Objetivos Específicos
            </h4>
            <div className="flex flex-wrap gap-2">
              {userData.specificObjectives?.map((obj, index) => (
                <Badge
                  key={`spec-${index}`}
                  variant="outline"
                  className="text-sm px-3 py-1 border-primary/50 text-primary hover:bg-primary/10"
                >
                  {obj}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
