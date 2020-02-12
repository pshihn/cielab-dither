export type ColorType = 'rgb' | 'hsv' | 'lab';
export type Color = [number, number, number];

const _RgbLabMap = new Map<string, Color>();
const _LabRgbMap = new Map<string, Color>();
const _RgbHsvMap = new Map<string, Color>();
const _HsvRgbMap = new Map<string, Color>();

export function hexToRgb(hex: string): Color {
  let rgb: Color = [0, 0, 0];
  if ((hex.length === 4) || hex.length > 6) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    rgb = [
      +`0x${hex[0]}${hex[0]}`,
      +`0x${hex[1]}${hex[1]}`,
      +`0x${hex[2]}${hex[2]}`
    ];
  } else if (hex.length >= 6) {
    rgb = [
      +`0x${hex[0]}${hex[1]}`,
      +`0x${hex[2]}${hex[3]}`,
      +`0x${hex[4]}${hex[5]}`
    ];
  }
  return rgb;
}

export function hexToLab(hex: string): Color {
  return rgbToLab(hexToRgb(hex));
}

export function rgbToLab(rgb: Color): Color {
  const key = rgb.join(',');
  if (_RgbLabMap.has(key)) {
    return _RgbLabMap.get(key)!;
  }
  let [r, g, b] = rgb;
  r = rgb[0] / 255;
  g = rgb[1] / 255;
  b = rgb[2] / 255;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  const lab: Color = [
    (116 * y) - 16,
    500 * (x - y),
    200 * (y - z)
  ];
  _RgbLabMap.set(key, lab);
  return lab;
}

export function labToRgb(lab: Color): Color {
  const key = lab.join(',');
  if (_LabRgbMap.has(key)) {
    return _LabRgbMap.get(key)!;
  }

  let y = (lab[0] + 16) / 116;
  let x = lab[1] / 500 + y;
  let z = y - lab[2] / 200;
  let [r, g, b] = [0, 0, 0];

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.2040 + z * 1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1 / 2.4) - 0.055) : 12.92 * b;

  const rgb: Color = [
    Math.round(Math.max(0, Math.min(1, r)) * 255),
    Math.round(Math.max(0, Math.min(1, g)) * 255),
    Math.round(Math.max(0, Math.min(1, b)) * 255)
  ];

  _LabRgbMap.set(key, rgb);
  return rgb;
}

export function rgbToHsv(rgb: Color): Color {
  const key = rgb.join(',');
  if (_RgbHsvMap.has(key)) {
    return _RgbHsvMap.get(key)!;
  }
  let [r, g, b] = rgb;
  r /= 255, g /= 255, b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number = max;
  let s: number = max;
  const v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  const hsv: Color = [h, s, v];
  _RgbHsvMap.set(key, hsv);
  return hsv;
}

export function hsvToRgb(hsv: Color): Color {
  const key = hsv.join(',');
  if (_HsvRgbMap.has(key)) {
    return _HsvRgbMap.get(key)!;
  }

  const [h, s, v] = hsv;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let [r, g, b] = [0, 0, 0];

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  const rgb: Color = [r * 255, g * 255, b * 255];
  _HsvRgbMap.set(key, rgb);
  return rgb;
}

export function colorDistance(a: Color, b: Color): number {
  return Math.sqrt(
    Math.pow(b[0] - a[0], 2) +
    Math.pow(b[1] - a[1], 2) +
    Math.pow(b[2] - a[2], 2)
  );
}

export function subtractColors(c1: Color, c2: Color): Color {
  return [
    c1[0] - c2[0],
    c1[1] - c2[1],
    c1[2] - c2[2]
  ];
}

export function addColors(c1: Color, c2: Color): Color {
  return [
    c1[0] + c2[0],
    c1[1] + c2[1],
    c1[2] + c2[2]
  ];
}

export function colorGain(c: Color, gain: number): Color {
  return [
    c[0] * gain,
    c[1] * gain,
    c[2] * gain
  ];
}

interface ColorDiffItem {
  diff: number;
  color: Color;
}
export function closestColor(color: Color, palette: Color[]): Color {
  const diffItems = palette.map<ColorDiffItem>((p) => {
    return {
      diff: colorDistance(color, p),
      color: p
    };
  });
  diffItems.sort((a, b) => {
    return a.diff - b.diff;
  });
  const closestColor = diffItems[0];
  return closestColor.color;
}