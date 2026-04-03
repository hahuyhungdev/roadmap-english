"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  round: boolean;
}

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#3b82f6", // blue
  "#f97316", // orange
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    duration: 1.5 + Math.random() * 1.5,
    delay: Math.random() * 0.8,
    rotation: Math.random() * 720 - 360,
    round: Math.random() > 0.5,
  }));
}

interface Props {
  /** When this becomes true, fire the celebration. Reset to false to allow re-firing. */
  active: boolean;
  message?: string;
  onDone?: () => void;
}

export function CelebrationOverlay({
  active,
  message = "🎉 All sentences practiced!",
  onDone,
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    setParticles(makeParticles(50));
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setParticles([]);
      onDone?.();
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(0deg)`,
          }}
        />
      ))}

      {/* Message banner */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="bg-white/95 backdrop-blur-sm border border-indigo-200 shadow-2xl rounded-2xl px-8 py-5 text-center"
          style={{
            animation:
              "celebrationPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <p className="text-2xl font-bold text-gray-900 mb-1">{message}</p>
          <p className="text-sm text-gray-500">Great work! Keep going 🚀</p>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(var(--r, 360deg)); opacity: 0; }
        }
        @keyframes celebrationPop {
          0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
