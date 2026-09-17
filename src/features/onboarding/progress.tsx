export function OnboardingProgress({ step, label }: { step: number; label: string }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-field"}`}
          />
        ))}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
    </div>
  );
}
