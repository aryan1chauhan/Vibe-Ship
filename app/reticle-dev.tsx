"use client";

import { useEffect } from "react";

export function ReticleDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      Promise.all([
        import("@reticlehq/react"),
        import("@reticlehq/browser"),
      ])
        .then(([{ install }, { reticle }]) => {
          install();
          reticle.connect();
        })
        .catch((err) => {
          console.warn("[Reticle] Dev bridge initialization notice:", err);
        });
    }
  }, []);

  return null;
}
