'use client';

export default function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-[#08152f]"
    >
      Réessayer
    </button>
  );
}
