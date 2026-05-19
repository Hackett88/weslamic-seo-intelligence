"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps the route content with a key that changes on every pathname change,
 * so React unmounts/remounts the subtree and the CSS animation .route-fade
 * replays — gives the feeling of a brief curtain-fade between routes.
 */
export function RouteFader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-fade flex-1 min-h-0 flex flex-col">
      {children}
    </div>
  );
}
