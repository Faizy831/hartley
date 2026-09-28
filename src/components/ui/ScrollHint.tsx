"use client";
export function ScrollHint() {
  return (
    <div className="scroll-hint" data-intro="fade" style={{ opacity: 0 }} aria-hidden="true">
      <span className="t-micro">Scroll</span>
      <span className="scroll-hint__line">
        <i />
      </span>
    </div>
  );
}
