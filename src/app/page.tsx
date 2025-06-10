"use client";
import FrequentQuestions from "@/components/landing/FrequentQuestions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, useAnimation } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const Feature = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center p-4">
    {icon}
    <h3 className="text-xl font-semibold mt-2">{title}</h3>
    <p className="text-gray-600 text-center">{description}</p>
  </div>
);

const Testimonial = ({
  name,
  title,
  quote,
  image,
}: {
  name: string;
  title: string;
  quote: string;
  image: string;
}) => (
  <Card className="w-full max-w-md p-4">
    <CardHeader>
      <CardTitle className="flex items-center">
        <img src={image} alt={name} className="w-14 h-14 rounded-full object-cover mr-2" />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription>"{quote}"</CardDescription>
    </CardContent>
  </Card>
);

const ImageOrVideo = ({
  src,
  alt,
  type,
}: {
  src: string;
  alt: string;
  type: "image" | "video";
}) => {
  if (type === "image") {
    return <img src={src} alt={alt} className="rounded-lg shadow-md" />;
  }
  return (
    <video autoPlay={true} className="rounded-lg shadow-md" muted loop>
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default function Page() {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const animation = useAnimation();

  useEffect(() => {
    if (inView) {
      animation.start({
        x: 0,
        opacity: 1,
        transition: {
          duration: 0.8,
          bounce: 0.3,
        },
      });
    } else {
      animation.start({
        x: -100,
        opacity: 0,
      });
    }
  }, [inView, animation]);

  return (
    <div className="bg-gray-50">
      <section className="py-20 bg-white">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-gray-800 font-lora">
            hormiw<span className="text-primary uppercase">i</span>t
            <span className="text-primary uppercase">a</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Controla tus gastos hormiga, mejora tu economía y alcanza tus metas.{" "}
            <br></br>
            Apóyate en la inteligencia artificial para tomar decisiones
            financieras más inteligentes.
          </p>
          <Button asChild size="lg">
            <Link href="/onboarding">Comenzar</Link>
          </Button>
        </div>
      </section>
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto max-w-6xl">
          <FrequentQuestions />
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
            Nuestras armas secretas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              title="Crea tu Meta, Caza tu Sueño"
              description="Define eso que tanto quieres (un viaje, un máster, la entrada de un piso) y convierte el ahorro en un juego."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-check-square"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <path d="M9 12l2 2 5-5" />
                </svg>
              }
            />
            <Feature
              title="Alíate con tu 'Yo' del Futuro"
              description="La persona más interesada en que ahorres eres tú dentro de unos años. Te ayudamos a no decepcionarle."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-users"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <Feature
              title="Gráficos que dan gustito mirar"
              description="Visualiza cómo cada pequeño sacrificio se convierte en una victoria. Spoiler: engancha más que una serie."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-activity"
                >
                  <path d="M22 12h-4l-3 8L9 4l-3 8H2" />
                </svg>
              }
            />
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
            ¿Quién ha probado esto y ha sobrevivido?
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            <Testimonial
              name="Sofía 'la Manirrota' Pérez"
              title="Ex-adicta a las ofertas online"
              quote="Descubrí que me gastaba más en 'gastos de envío gratis' que en la hipoteca. Hormiwita me hizo la intervención que necesitaba."
              image="https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            />
            <Testimonial
              name="Javier 'Objetivo Maldivas' García"
              title="CEO de Mis Propios Sueños"
              quote="Pensaba que ahorrar era deprimente. Ahora cada café que no compro es un metro más de playa paradisíaca. La app casi que te aplaude."
              image="https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bWFufGVufDB8fDB8fHww"
            />
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
            ¿No te fías? Míralo en acción
          </h2>
          <div className="flex justify-center max-w-3xl mx-auto px-4">
            <ImageOrVideo
              src="/hormiwita_edited.mp4"
              alt="App Demo Video"
              type="video"
            />
          </div>
        </div>
      </section>
      <motion.section ref={ref} animate={animation} className="py-20 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">
            ¿Listo para la intervención?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a Hormiwita. Tu 'yo' del futuro te lo agradecerá (y mucho).
          </p>
          <Button asChild size="lg" variant="default">
            <Link href="/onboarding">Comenzar GRATIS</Link>
          </Button>
        </div>
      </motion.section>
      <footer className="py-8 bg-gray-200 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Hormiwita 🤟. All rights reserved.</p>
      </footer>
    </div>
  );
}
