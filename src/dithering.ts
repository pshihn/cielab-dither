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