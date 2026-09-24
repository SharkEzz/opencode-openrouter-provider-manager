/** Number formats from the design system: units always, tabular, never a rounded price. */

export const ms = (value: number) => `${Math.round(value).toLocaleString('en-US')}ms`;

export const tps = (value: number) => `${value.toFixed(1)} tok/s`;

export const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

/** Catalog prices are shown exactly as published (e.g. $0.0042 /M). */
export const pricePerM = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;

/** Estimates (calculator totals) are rounded to the cent, and labelled as estimates. */
export const usd = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const tokens = (value: number) =>
  value >= 1e9
    ? `${(value / 1e9).toFixed(1)}B`
    : value >= 1e6
      ? `${(value / 1e6).toFixed(1)}M`
      : value >= 1e3
        ? `${Math.round(value / 1e3)}k`
        : String(value);

/** A pinned/Auto ratio as a signed change: 0.72 → "−28%", 1.18 → "+18%". */
export const change = (ratio: number) => {
  const delta = Math.round((ratio - 1) * 100);
  return `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta)}%`;
};

/** Short model name for compact labels: "z-ai/glm-5.3-flash" → "glm-5.3-flash". */
export const shortModel = (model: string) => model.split('/').pop() ?? model;
