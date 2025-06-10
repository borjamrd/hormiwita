import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  className?: string;
}

const TypewriterText = ({
  text,
  delay = 0.02,
  className,
}: TypewriterTextProps) => {
  return (
    <span className={cn(`${className} inline-block`)}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * delay }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

export default TypewriterText;
