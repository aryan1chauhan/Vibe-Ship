import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center min-h-screen font-sans p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
          404
        </h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The page you are looking for does not exist or has been moved. Let's get you back on track.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
