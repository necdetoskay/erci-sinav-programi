"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AILoadingProps {
  className?: string;
}

export function AILoading({ className }: AILoadingProps) {
  return (
    <div className={cn("relative w-full h-64", className)}>
      {/* Arka plan efekti */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg"
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Merkezdeki beyin animasyonu */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative w-32 h-32"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Dönen dış çember */}
          <motion.div
            className="absolute inset-0 border-4 border-blue-500/50 rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Nöron bağlantıları */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-500 rounded-full"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 45}deg) translateX(${40}px)`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Merkezdeki parçacık */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      {/* Yükleniyor metni */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 text-center text-lg font-medium text-foreground/80"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Yapay Zeka Soruları Üretiyor...
      </motion.div>
    </div>
  );
} 