export interface ColorPalette {
  primary: string; // e.g. "rgb(235, 75, 90)"
  glow: string; // e.g. "rgba(235, 75, 90, 0.45)"
  subtle: string; // e.g. "rgba(235, 75, 90, 0.15)"
  border: string; // e.g. "rgba(235, 75, 90, 0.3)"
  text: string; // e.g. "rgb(255, 120, 130)"
}

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#10b981',
  glow: 'rgba(16, 185, 129, 0.45)',
  subtle: 'rgba(16, 185, 129, 0.15)',
  border: 'rgba(16, 185, 129, 0.3)',
  text: '#6ee7b7',
};

const paletteCache = new Map<string, ColorPalette>();

export function extractDominantColor(imageUrl: string): Promise<ColorPalette> {
  if (!imageUrl) return Promise.resolve(DEFAULT_PALETTE);

  if (paletteCache.has(imageUrl)) {
    return Promise.resolve(paletteCache.get(imageUrl)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        const size = 32;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        let bestR = 16,
          bestG = 185,
          bestB = 129;
        let maxScore = -1;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue;

          // Compute perceived brightness
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // Skip pitch darks and washed-out whites
          if (lum < 35 || lum > 235) continue;

          // Compute saturation / vibrancy
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          if (delta < 25) continue; // Skip grays / neutrals

          const saturation = delta / max;
          // Score balances vibrant saturation and good middle luminance
          const lumScore = 1.0 - Math.abs(lum - 128) / 128;
          const score = saturation * 1.8 + lumScore * 0.9;

          if (score > maxScore) {
            maxScore = score;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        const primary = `rgb(${bestR}, ${bestG}, ${bestB})`;
        const glow = `rgba(${bestR}, ${bestG}, ${bestB}, 0.5)`;
        const subtle = `rgba(${bestR}, ${bestG}, ${bestB}, 0.18)`;
        const border = `rgba(${bestR}, ${bestG}, ${bestB}, 0.35)`;
        const text = `rgb(${Math.min(255, bestR + 40)}, ${Math.min(255, bestG + 40)}, ${Math.min(255, bestB + 40)})`;

        const palette: ColorPalette = { primary, glow, subtle, border, text };
        paletteCache.set(imageUrl, palette);
        resolve(palette);
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_PALETTE);
    };

    img.src = imageUrl;
  });
}
