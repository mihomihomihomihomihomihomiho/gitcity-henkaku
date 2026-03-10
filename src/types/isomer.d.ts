declare module "isomer" {
  export class Point {
    constructor(x: number, y: number, z: number);
    x: number;
    y: number;
    z: number;
    static ORIGIN: Point;
  }

  export class Shape {
    static Prism(
      origin: Point,
      dx: number,
      dy: number,
      dz: number
    ): Shape;
  }

  export class Color {
    constructor(r: number, g: number, b: number, a?: number);
    r: number;
    g: number;
    b: number;
    a: number;
  }

  export interface IsomerOptions {
    scale?: number;
    originX?: number;
    originY?: number;
  }

  export default class Isomer {
    constructor(canvas: HTMLCanvasElement, options?: IsomerOptions);
    add(shape: Shape, color?: Color): void;
    canvas: HTMLCanvasElement;
  }
}
