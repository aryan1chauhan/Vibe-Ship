"use client";

import React, { useEffect } from "react";

export interface ReticleCapability {
  id: string;
  name: string;
  testId: string;
  action: string;
}

export function ReticleDevOverlay() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Reticle] Developer overlay initialized. Reticle testids active.");
    }
  }, []);

  return null;
}

export const RETICLE_CAPABILITIES: ReticleCapability[] = [
  { id: "task-create", name: "Create Task", testId: "create-task-btn", action: "click" },
  { id: "task-input", name: "Task Prompt Input", testId: "task-prompt-input", action: "input" },
  { id: "login-submit", name: "Submit Login", testId: "login-submit-btn", action: "click" },
];
