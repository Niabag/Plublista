import { useState } from 'react';
import { Gift, Copy, Check, Sparkles } from 'lucide-react';

const PROMO_CODE = 'LISTACODE2026';

export function ListaCodePage() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Lava lamp effect layer */}
      <div className="lava-container">
        <div className="lava-blob lava-blob-1" />
        <div className="lava-blob lava-blob-2" />
        <div className="lava-blob lava-blob-3" />
        <div className="lava-blob lava-blob-4" />
        <div className="lava-blob lava-blob-5" />
      </div>

      {/* White semi-transparent overlay */}
      <div className="fixed inset-0 z-10 bg-white/50" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo "Lista|Code" */}
        <div className="mb-8 select-none text-center">
          <h1 className="text-6xl font-bold tracking-tight md:text-8xl">
            <span className="font-[800] text-[#3F48CC]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Lista
            </span>
            <span className="font-[800] text-[#3F48CC]" style={{ fontFamily: 'Inter, sans-serif' }}>
              |
            </span>
            <span className="font-light tracking-widest text-white" style={{ fontFamily: "'Courier New', monospace" }}>
              Code
            </span>
          </h1>
        </div>

        {/* Gift card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-black p-8 text-white shadow-2xl">
            {/* Gift icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#3F48CC]/20">
                <Gift className="size-10 text-[#3F48CC]" />
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-center text-2xl font-bold">
              <Sparkles className="mb-1 mr-2 inline size-5 text-[#3F48CC]" />
              You got a gift!
              <Sparkles className="mb-1 ml-2 inline size-5 text-[#3F48CC]" />
            </h2>
            <p className="mb-8 text-center text-gray-400">
              Use this exclusive promo code to unlock your reward on Plublista
            </p>

            {/* Promo code */}
            <div className="mb-6 rounded-lg border-2 border-dashed border-[#3F48CC]/50 bg-[#3F48CC]/10 p-4">
              <p className="text-center font-mono text-3xl font-bold tracking-widest text-white">
                {PROMO_CODE}
              </p>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3F48CC] px-6 py-3 font-semibold text-white transition-all hover:bg-[#3F48CC]/80 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="size-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-5" />
                  Copy code
                </>
              )}
            </button>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-gray-500">
              This code is valid for a limited time. Apply it during registration or in your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
