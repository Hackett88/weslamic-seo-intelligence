"use client";

import { useEffect, useState } from "react";

export function CurrentTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = () =>
      new Date().toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    setTime(format());
    const id = setInterval(() => setTime(format()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return <span className="text-zinc-600 text-xs hidden sm:block">{time}</span>;
}
