declare module "color-thief-browser" {
  export default class ColorThief {
    getColor(image: HTMLImageElement): [number, number, number];
    getPalette(image: HTMLImageElement, colorCount?: number): [number, number, number][];
  }
}