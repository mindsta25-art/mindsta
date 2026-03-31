import { useEffect, useState, useCallback } from "react";
import { BookOpen, Wifi } from "lucide-react";

const MESSAGES = [
  "Sharpening the pencils",
  "Arranging the books",
  "Waking up the teachers",
  "Turning on the classroom lights",
  "Setting up your desk",
  "Getting the lessons ready",
  "Checking the homework board",
  "Almost there",
];

interface Props {
  onReady: () => void;
}

function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return "https://api.mindsta.com.ng/api";
  return "http://localhost:3000/api";
}

export default function ServerStartingUp({ onReady }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  // Ping the backend every 5 seconds until it responds
  const ping = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${getApiBase()}/ping`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        onReady();
        return;
      }
    } catch {
      // server still sleeping — rotate message
    }
    setAttempt((a) => a + 1);
    setMsgIndex((i) => (i + 1) % MESSAGES.length);
  }, [onReady]);

  useEffect(() => {
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, [ping]);

  // Animate the trailing dots: . → .. → ...
  useEffect(() => {
    const interval = setInterval(
      () => setDotCount((d) => (d % 3) + 1),
      420,
    );
    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);
  const estimatedSeconds = Math.max(0, 55 - attempt * 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950/30 dark:to-gray-950 flex flex-col items-center justify-center px-4">
      {/* Mindsta logo */}
      <div className="flex items-center gap-2.5 mb-14">
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
          <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Mindsta
          </span>
          <p className="text-[10px] leading-tight text-muted-foreground">
            Every Child Can Do Well
          </p>
        </div>
      </div>

      {/* Pulsing icon with ping rings */}
      <div className="relative mb-10 flex items-center justify-center">
        {/* Outer slow ping ring */}
        <div className="absolute w-32 h-32 rounded-full border-2 border-purple-300 dark:border-purple-700 animate-ping opacity-20" />
        {/* Middle ping ring */}
        <div
          className="absolute w-24 h-24 rounded-full border-2 border-pink-300 dark:border-pink-700 animate-ping opacity-30"
          style={{ animationDelay: "0.5s" }}
        />
        {/* Icon circle */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
          <BookOpen className="w-9 h-9 text-white" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
        Getting your classroom ready!
      </h1>

      {/* Cycling message with animated dots */}
      <p className="text-purple-600 dark:text-purple-400 font-medium text-base sm:text-lg text-center mb-8 min-h-[1.75rem] transition-all duration-300">
        {MESSAGES[msgIndex]}
        {dots}
      </p>

      {/* Info card */}
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-purple-100 dark:border-purple-900/40 rounded-2xl px-6 py-5 max-w-xs w-full text-center shadow-sm">
        <Wifi className="w-5 h-5 text-purple-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Our server takes a short nap when no one's around — it's waking up
          now!
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          {attempt === 0
            ? "Checking connection\u2026"
            : estimatedSeconds > 0
              ? `About ${estimatedSeconds} seconds remaining`
              : "Finishing up\u2026"}
        </p>
      </div>

      {/* Bouncing dots loader */}
      <div className="flex gap-2 mt-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-purple-400 to-pink-400"
            style={{
              animation: `wakeup-bounce 1.2s ease-in-out ${i * 0.18}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes wakeup-bounce {
          from { transform: translateY(0px); opacity: 0.4; }
          to   { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
