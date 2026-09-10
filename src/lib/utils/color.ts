/** Relative luminance of a hex color (sRGB, 0–1). */
function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Returns a readable foreground (near-white or near-black) for a solid background. */
export function readableTextOn(hex: string): string {
  try {
    return luminance(hex) > 0.55 ? "#141414" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}
