export type Color = 'white' | 'black';

export const oppositeColor = (c: Color): Color =>
  c === 'white' ? 'black' : 'white';
