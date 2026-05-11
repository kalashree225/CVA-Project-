"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-8 bg-black text-white font-sans">
          <div className="max-w-md w-full border border-red-900/30 bg-red-950/20 p-8 rounded-2xl backdrop-blur-xl">
             <div className="h-1 w-12 bg-red-500 mb-6" />
             <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
               Critical <span className="text-red-500">System Failure</span>
             </h2>
             <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed">
               The Sentinel Intelligence Platform has encountered a kernel-level exception. 
               All neural synchronizations have been paused for safety.
             </p>
             <div className="bg-black/40 border border-white/5 p-4 rounded-lg mb-8">
                <code className="text-[10px] font-mono text-red-400 break-all">
                   {error.message || "Unknown Platform Error [ERR_SENTINEL_CRASH]"}
                </code>
             </div>
             <button
               onClick={() => reset()}
               className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-xs transition-all rounded-xl"
             >
               Attempt System Reboot
             </button>
          </div>
        </div>
      </body>
    </html>
  );
}
