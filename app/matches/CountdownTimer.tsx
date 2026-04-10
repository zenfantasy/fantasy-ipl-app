"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  startTime: string;
  fallback: string;
};

function getCountdown(startTime: string, now: Date): string {
  const diff = new Date(startTime).getTime() - now.getTime();

  if (!Number.isFinite(diff) || diff <= 0) return "LIVE";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours}h ${mins}m ${secs}s`;
}

export default function CountdownTimer({ startTime, fallback }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(fallback);

  useEffect(() => {
    const update = () => setCountdown(getCountdown(startTime, new Date()));
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <>{countdown}</>;
}
