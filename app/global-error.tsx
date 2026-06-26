'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center min-h-screen font-sans p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-sm text-zinc-400">
            A critical error occurred. Please try reloading the application.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
