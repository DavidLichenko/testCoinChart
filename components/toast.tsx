"use client";

import { toast as hotToast } from "react-hot-toast";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Variant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "destructive";

interface RichToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: Variant;
  duration?: number;
}

export function toast({
  title,
  description,
  variant = "default",
  duration = 3000,
}: RichToastOptions) {
  return hotToast.custom(
    (t) => (
      <AnimatePresence>
        {t.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`max-w-sm w-full bg-white dark:bg-zinc-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 toast-${variant}`}
          >
            <div className="flex flex-col">
              <p className="text-sm font-medium">{title}</p>
              {description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    { duration }
  );
}
