import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import TypewriterText from "./TypewritterText";

const questions1 = [
  "Quiero ahorrar para mi máster, pero no sé por dónde empezar",
  "Gestiono los gastos del hogar y a veces siento que se me escapan cosas",
  "Me gustaría controlar mejor mis finanzas para comprarme un coche",
  "Estoy buscando opciones de hipoteca y no entiendo bien los requisitos",
];

const questions2 = [
  "¿Cómo puedo organizar mis ahorros de forma sencilla?",
  "¿Hay alguna forma de visualizar en qué se va el dinero cada mes?",
  "¿Qué herramientas me ayudan a planificar una compra grande?",
  "¿Qué debo tener en cuenta antes de solicitar una hipoteca?",
];

const userQuestions = [
  "¿Cómo puedo empezar a ahorrar si tengo ingresos variables?",
  "¿Cuál es la mejor manera de llevar el control de los gastos familiares?",
  "¿Qué consejos hay para planificar una compra importante como un coche?",
  "¿Qué pasos debo seguir para prepararme antes de pedir una hipoteca?",
];

const answers = [
  "Empieza por registrar todos tus ingresos y gastos, aunque sean variables. Ientificar patrones y establece un objetivo de ahorro mensual. Con Hormiwita avanzas hacia tu máster.",
  "Lo ideal es anotar todos los gastos, incluso los pequeños. Hormiwita te ayuda a registrar y visualizar todos los gastos del hogar fácilmente.",
  "Antes de una compra grande, revisa tus ingresos, gastos y ahorros. Establece un presupuesto y un plazo para alcanzar tu objetivo. Todo con Hormiwita.",
  "Infórmate sobre los requisitos y compara diferentes ofertas de hipoteca. Organiza tus finanzas y compara opciones de hipoteca usando Hormiwita.",
];

const FrequentQuestions = () => {
  const controls = useAnimation();
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    const startAnimation = async () => {
      if (animationStarted) return;
      setAnimationStarted(true);

      const totalMessages = conversation.length;
      let currentIndex = 0;

      const showNextMessage = () => {
        if (currentIndex >= totalMessages) return;

        setTypingIndex(currentIndex);

        setTimeout(() => {
          setVisibleMessages((prev) => [...prev, currentIndex]);
          setTypingIndex(null);

          setTimeout(() => {
            currentIndex++;
            showNextMessage();
          }, 100);
        }, 2200);
      };

      showNextMessage();

      await controls.start((i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.4, duration: 0.5 },
      }));
    };

    const handleScroll = () => {
      const section = document.getElementById("preguntas-frecuentes");
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          startAnimation();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Check on mount too
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [controls, animationStarted]);

  // Typing animation component
  const TypingDots = () => (
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-[pulse_1s_infinite_0ms]"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-[pulse_1s_infinite_300ms]"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-[pulse_1s_infinite_600ms]"></div>
    </div>
  );

  // Check if a message should be visible with typing animation or content
  const isTyping = (index: number) => typingIndex === index;
  const isVisible = (index: number) => visibleMessages.includes(index);
  const shouldShowMessage = (index: number) =>
    typingIndex !== null || visibleMessages.length > 0
      ? index <= Math.max(typingIndex || 0, ...visibleMessages)
      : false;

  // Framer Motion variants for smooth transitions
  const messageVariants = {
    typing: { opacity: 1 },
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  // Variants for the message container's vertical movement
  const containerVariants = {
    initial: { y: 0 },
    animate: { y: 0, transition: { staggerChildren: 0.3 } },
  };

  const conversation = questions1.flatMap((q, i) => [
    { type: "question", content: q },
    { type: "answer", content: questions2[i] },
  ]);

  return (
    <section
      id="preguntas-frecuentes"
      className="pb-12 md:pb-20 mx-auto flex flex-col gap-12 md:gap-20 px-4 sm:px-6"
    >
      <div className="rounded-3xl border-primary border-2 text-primary text-center px-6 pb-24 pt-12 flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Área de los mensajes */}
        <motion.div
          className="w-full max-w-lg mx-auto h-[255px] relative mb-8"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <div
            className="absolute w-full h-full px-4 bottom-0 flex flex-col justify-end gap-5 pb-2.5"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 60%)",
            }}
          >
            {conversation.map(
              (item, index) =>
                shouldShowMessage(index) && (
                  <motion.div
                    key={`conv-${index}`}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className={cn(
                      "rounded-3xl px-4 py-2 text-sm text-primary relative text-pretty w-fit",
                      item.type === "question"
                        ? "bg-primary self-start text-left"
                        : "bg-primary self-end text-left"
                    )}
                    style={{
                      transform: `rotate(${-1 + Math.random() * 2}deg)`,
                    }}
                  >
                    <div
                      className={cn(
                        "absolute bottom-[-12px] whitespace-nowrap",
                        item.type === "question"
                          ? "left-3 text-primary"
                          : "right-3 text-primary"
                      )}
                    >
                      {item.type === "question" ? "◤" : "◥"}
                    </div>

                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="w-fit">
                        {isTyping(index) ? (
                          <TypingDots />
                        ) : isVisible(index) ? (
                          <TypewriterText
                            className={
                              item.type === "question"
                                ? "text-white"
                                : "text-slate-100 font-semibold"
                            }
                            text={item.content}
                          />
                        ) : (
                          <span className="opacity-0 invisible">
                            {item.content}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )
            )}
          </div>
        </motion.div>

        {/* Textos de encabezado */}
        <div className="max-w-[588px] mx-auto flex flex-col gap-3 relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold font-lora">
            Surgen <em>dudas</em>. Es normal.
          </h2>
          <p className="text-base md:text-lg">
            Desde pequeñas preocupaciones hasta grandes interrogantes, todos
            tenemos preguntas antes de comenzar. Estamos aquí para ayudarte.
          </p>
        </div>
      </div>

      {/* Sección de respuestas */}
      <div className="max-w-[768px] mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
        <span className="text-primary">De estas preguntas, <span className="underline">te has hecho mínimo dos</span>.</span> Si no es así, es que lo tienes clarísimo.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userQuestions.map((question, index) => (
            <div
              key={`faq-${index}`}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
              <h3 className="font-semibold text-lg mb-2 text-primary">
                {question}
              </h3>
              <p className="text-gray-600">{answers[index]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FrequentQuestions;
