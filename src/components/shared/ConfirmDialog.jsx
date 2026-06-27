"use client";
import { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  confirmClassName,
  onConfirm,
  loading,
}) {
  const titleId = useId();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!loading) onClose();
            }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-lg space-y-4 rounded-xl border border-border bg-background p-6 shadow-lg"
          >
            <div className="space-y-2">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>

              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}

              {children}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>

              <Button
                className={confirmClassName}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? `${confirmLabel}…` : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
