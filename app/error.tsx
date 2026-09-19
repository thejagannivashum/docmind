"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-extrabold mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        An unexpected error occurred. Please try reloading or returning to dashboard.
      </p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
