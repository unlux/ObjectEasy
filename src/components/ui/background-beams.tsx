"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const random = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const beams = Array.from({ length: 50 }).map((_, i) => ({
    i,
    x: random(-10, 110),
    y: random(-10, 110),
    duration: random(20, 40),
    delay: random(0, 20),
  }));

  return (
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-full overflow-hidden",
        className
      )}
    >
      <div className="relative w-full h-full">
        {beams.map((beam) => (
          <motion.div
            key={`beam-${beam.i}`}
            initial={{
              y: beam.y + "vh",
              x: beam.x + "vw",
            }}
            animate={{
              y: [beam.y + "vh", beam.y - 20 + "vh"],
              x: [beam.x + "vw", beam.x + 20 + "vw"],
            }}
            transition={{
              duration: beam.duration,
              delay: beam.delay,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1px",
              height: "100vh",
              background:
                "linear-gradient(to bottom, transparent, #4f46e5, transparent)",
            }}
          />
        ))}
      </div>
    </div>
  );
};
