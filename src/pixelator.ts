import { ColorType, Color, rgbToLab, rgbToHsv, hsvToRgb, labToRgb } from './colors';

export type Point = [number, number];

export class Pixelator {
  private data: ImageData;
  private maps = new Map<ColorType, Map<string, Color>>();

  constructor(data: ImageData) {
    this.data = data;
  }

  private initMap(type: ColorType): Map<string, Color> {
    if (!this.maps.has(type)) {
      this.maps.set(type, new Map<string, Color>());
    }
    return this.maps.get(type)!;
  }

  private getPixel(map: Map<string, Color>, point: Point): Color | undefined {
    return map.get(point.join(','));
  }

  private setPixel(map: Map<string, Color>, point: Point, value: Color): void {
    map.set(point.join(','), value);
  }

  read(pixel: Point, type: ColorType = 'rgb'): Color {
    const map = this.initMap(type);
    const cached = this.getPixel(map, pixel);
    if (cached) {
      return cached;
    }
    let color: Color | null = null;
    const raw = this.data.data;
    const width = this.data.width;
    const rgb: Color = [
      raw[(pixel[1] * width * 4) + (pixel[0] * 4)],
      raw[(pixel[1] * width * 4) + (pixel[0] * 4) + 1],
      raw[(pixel[1] * width * 4) + (pixel[0] * 4) + 2]
    ];
    switch (type) {
      case 'rgb':
        color = rgb;
        break;
      case 'lab':
        color = rgbToLab(rgb);
        break;
      case 'hsv':
        color = rgbToHsv(rgb);
        break;
    }
    this.setPixel(map, pixel, color);
    return color;
  }

  write(pixel: Point, value: Color, type: ColorType = 'rgb'): void {
    let rgb = value;
    switch (type) {
      case 'hsv':
        rgb = hsvToRgb(value);
        break;
      case 'lab':
        rgb = labToRgb(value);
        break;
      case 'rgb':
        break;
    }
    const raw = this.data.data;
    const width = this.data.width;
    raw[(pixel[1] * width * 4) + (pixel[0] * 4)] = rgb[0];
    raw[(pixel[1] * width * 4) + (pixel[0] * 4) + 1] = rgb[1];
    raw[(pixel[1] * width * 4) + (pixel[0] * 4) + 2] = rgb[2];
  }
}