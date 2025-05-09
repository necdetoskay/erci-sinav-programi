"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, Zap } from "lucide-react";

interface AILoadingProps {
  className?: string;
  message?: string;
}

export function AILoading({ className, message = "Yapay Zeka Soruları Üretiyor..." }: AILoadingProps) {
  // Rastgele veri akışı noktaları oluştur
  const dataFlowPoints = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 1 + Math.random() * 2,
    size: 1 + Math.random() * 3,
    startX: Math.random() * 100,
    startY: Math.random() * 100,
    endX: Math.random() * 100,
    endY: Math.random() * 100,
  }));

  // Rastgele nöron noktaları oluştur
  const neuronPoints = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80, // % cinsinden
    y: 10 + Math.random() * 80, // % cinsinden
    size: 2 + Math.random() * 4,
    pulseDelay: Math.random() * 3,
  }));

  // Nöron bağlantıları oluştur
  const connections = [];
  for (let i = 0; i < neuronPoints.length; i++) {
    // Her nöron için 1-3 bağlantı oluştur
    const connectionCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < connectionCount; j++) {
      // Rastgele bir hedef nöron seç
      const targetIndex = Math.floor(Math.random() * neuronPoints.length);
      if (targetIndex !== i) {
        connections.push({
          id: `${i}-${targetIndex}`,
          source: i,
          target: targetIndex,
          delay: Math.random() * 2,
        });
      }
    }
  }

  // Yükleme mesajları
  const loadingMessages = [
    "Yapay Zeka Modeli Çalışıyor...",
    "Sorular Oluşturuluyor...",
    "Cevap Seçenekleri Hazırlanıyor...",
    "Zorluk Seviyesi Ayarlanıyor...",
    "Sonuçlar İşleniyor..."
  ];

  return (
    <div className={cn("relative w-full h-80 overflow-hidden", className)}>
      {/* Arka plan efekti */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg"
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Nöron ağı */}
      <div className="absolute inset-0">
        {/* Nöron noktaları */}
        {neuronPoints.map((point) => (
          <motion.div
            key={`neuron-${point.id}`}
            className="absolute rounded-full bg-blue-500"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${point.size}px`,
              height: `${point.size}px`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
              boxShadow: [
                "0 0 0 rgba(59, 130, 246, 0)",
                "0 0 8px rgba(59, 130, 246, 0.5)",
                "0 0 0 rgba(59, 130, 246, 0)",
              ],
            }}
            transition={{
              duration: 2,
              delay: point.pulseDelay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Nöron bağlantıları */}
        <svg className="absolute inset-0 w-full h-full">
          {connections.map((conn) => {
            const source = neuronPoints[conn.source];
            const target = neuronPoints[conn.target];
            return (
              <motion.path
                key={`connection-${conn.id}`}
                d={`M ${source.x}% ${source.y}% L ${target.x}% ${target.y}%`}
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 0],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 3,
                  delay: conn.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </svg>

        {/* Veri akışı animasyonu */}
        {dataFlowPoints.map((point) => (
          <motion.div
            key={`data-${point.id}`}
            className="absolute rounded-full bg-purple-500"
            style={{
              width: `${point.size}px`,
              height: `${point.size}px`,
              left: `${point.startX}%`,
              top: `${point.startY}%`,
            }}
            animate={{
              left: [`${point.startX}%`, `${point.endX}%`],
              top: [`${point.startY}%`, `${point.endY}%`],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: point.duration,
              delay: point.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Merkezdeki beyin animasyonu */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative flex items-center justify-center w-40 h-40 bg-white/10 backdrop-blur-sm rounded-full border border-purple-500/30"
          animate={{
            boxShadow: [
              "0 0 0 rgba(139, 92, 246, 0)",
              "0 0 20px rgba(139, 92, 246, 0.5)",
              "0 0 0 rgba(139, 92, 246, 0)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* İç çember */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-blue-500/30"
            animate={{
              rotate: 360,
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              rotate: {
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />

          {/* Beyin ikonu */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative z-10"
          >
            <Brain className="h-16 w-16 text-purple-600" />
          </motion.div>

          {/* Parıltı efekti */}
          <motion.div
            className="absolute top-0 right-0 -mr-2 -mt-2"
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </motion.div>

          {/* Enerji efekti */}
          <motion.div
            className="absolute bottom-0 left-0 -ml-2 -mb-2"
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Zap className="h-6 w-6 text-blue-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Yükleniyor metni */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
        <motion.div
          className="text-center text-lg font-medium text-foreground/80 mb-2"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {message}
        </motion.div>

        {/* Yükleme göstergesi */}
        <motion.div
          className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            animate={{
              width: ["0%", "100%", "0%"],
              x: ["0%", "0%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Değişen yükleme mesajları */}
        <motion.div
          className="text-center text-xs text-foreground/60 mt-2"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={Date.now()}
          >
            {loadingMessages[Math.floor((Date.now() / 2000) % loadingMessages.length)]}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}