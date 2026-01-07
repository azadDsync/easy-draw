// app/index.tsx
// Entry point - immediately redirects to canvas
// No landing screen for blind-first accessibility

import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        router.replace("/canvas");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMounted, router]);

  return null;
}
