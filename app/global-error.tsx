"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="antialiased flex min-h-screen flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-6">A critical application error occurred.</p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
