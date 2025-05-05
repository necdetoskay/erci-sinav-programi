"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation"; // Use usePathname for client-side route changes

export const GlobalLoading = () => {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  useEffect(() => {
    // Only show loading if the route is actually changing
    if (pathname !== previousPathname) {
      setLoading(true);
    }
    setPreviousPathname(pathname);

    // Hide loading after a short delay to ensure content starts rendering
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, [pathname, previousPathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-semibold text-foreground">Bekleyiniz...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
