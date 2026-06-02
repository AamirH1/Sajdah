export const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;

  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getDynamicScreenGradient = (
  colors: { background: string; surfaceAlt: string; primary: string },
  isDark: boolean
): readonly [string, string] => (
  isDark
    ? [colors.background, colors.surfaceAlt]
    : [hexToRgba(colors.primary, 0.18), colors.background]
);

export const getDynamicHeroGradient = (
  colors: { primary: string },
  isDark: boolean
): readonly [string, string] => (
  isDark
    ? ['#111C14', '#2A3420']
    : [colors.primary, hexToRgba(colors.primary, 0.76)]
);
