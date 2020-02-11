import { Pixelator, Point } from './pixelator';
import { Color, closestColor, addColors, subtractColors, colorGain } from './colors';

const diffMap = new Map<Color[], Map<string, Color>>();

function getClosestColor(color: Color, palette: Color[]): Color {
  if (!diffMap.has(palette)) {
    diffMap.set(palette, new Map<string, Color>());
  }
  const map = diffMap.get(palette)!;
  const key = color.join(',');
  if (map.has(key)) {
    return map.get(key)!;
  }
  const ret = closestColor(color, palette);
  map.set(key, ret);
  return ret;
}

export function adoptPaletteNoDither(imageData: ImageData, palette: Color[]) {
  const p = new Pixelator(imageData);
  const { width, height } = imageData;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = p.read([x, y], 'lab');
      const closest = getClosestColor(color, palette);
      p.write([x, y], closest, 'lab');
    }
  }
}

export function adoptPaletteFloydSteinbergDither(imageData: ImageData, palette: Color[]) {
  const carryOvers = new Map<string, Color>();
  const p = new Pixelator(imageData);
  const { width, height } = imageData;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const point: Point = [x, y];
      const pointKey = point.join(',');
      let color = p.read([x, y], 'lab');
      const carryOverColor = carryOvers.get(pointKey);
      if (carryOverColor) {
        color = addColors(color, carryOverColor);
      }
      const closest = getClosestColor(color, palette);

      // find quant error
      const diff = subtractColors(color, closest);

      // Distribute error
      {
        const next: Point = [x + 1, y];
        const nextKey = next.join(',');
        let qError = carryOvers.get(nextKey) || [0, 0, 0];
        qError = addColors(qError, colorGain(diff, 7 / 16));
        carryOvers.set(nextKey, qError);
      }
      {
        const next: Point = [x + 1, y + 1];
        const nextKey = next.join(',');
        let qError = carryOvers.get(nextKey) || [0, 0, 0];
        qError = addColors(qError, colorGain(diff, 1 / 16));
        carryOvers.set(nextKey, qError);
      }
      {
        const next: Point = [x, y + 1];
        const nextKey = next.join(',');
        let qError = carryOvers.get(nextKey) || [0, 0, 0];
        qError = addColors(qError, colorGain(diff, 5 / 16));
        carryOvers.set(nextKey, qError);
      }
      {
        const next: Point = [x - 1, y + 1];
        const nextKey = next.join(',');
        let qError = carryOvers.get(nextKey) || [0, 0, 0];
        qError = addColors(qError, colorGain(diff, 3 / 16));
        carryOvers.set(nextKey, qError);
      }

      p.write([x, y], closest, 'lab');
    }
  }
}

export function removeLonePixels(imageData: ImageData) {
  const p = new Pixelator(imageData);
  const { width, height } = imageData;
  const map = new Map<string, number>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      map.clear();
      const color = p.read([x, y]);
      for (let dx = -1; dx <= 1; dx++) {
        const x2 = x + dx;
        if (x2 < 0 || x2 >= width) {
          continue;
        }
        for (let dy = -1; dy >= 1; dy++) {
          const y2 = y + dy;
          if (y2 < 0 || y2 >= height) {
            continue;
          }
          const c2 = p.read([x2, y2]);
          const key = c2.join(',');
          map.set(key, (map.get(key) || 0) + 1);
        }
      }
      const key = color.join(',');
      if (map.has(key) || map.size > 2) {
        continue;
      } else {
        let max = 0;
        let maxColor = '';
        for (const key of map.keys()) {
          const count = map.get(key)!;
          if (count > max) {
            max = count;
            maxColor = key;
          }
        }
        if (maxColor) {
          const newc = maxColor.split(',').map((d) => +d.trim()) as Color;
          p.write([x, y], newc);
        }
      }
    }
  }
}