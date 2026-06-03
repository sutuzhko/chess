const BASE = import.meta.env.BASE_URL;

export function assetUrl(path: string): string {
  return `${BASE}${path.replace(/^\/+/, '')}`;
}

export function figureUrl(name: string): string {
  return `${BASE}figures/${name}.png`;
}

export function publicUrl(name: string, ext = 'png'): string {
  return `${BASE}${name}.${ext}`;
}