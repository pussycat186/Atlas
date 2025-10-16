// JS implementations (WASM integration will be added post-build)
function hashJS(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function verifyJS(data: string, expectedHash: string): boolean {
  return hashJS(data) === expectedHash;
}

function normalizeJS(input: string): string {
  return input.trim().toLowerCase();
}

export async function hash(input: string): Promise<string> {
  return hashJS(input);
}

export async function verify(data: string, expectedHash: string): Promise<boolean> {
  return verifyJS(data, expectedHash);
}

export async function normalize(input: string): Promise<string> {
  return normalizeJS(input);
}

export function hashSync(input: string): string {
  return hashJS(input);
}

export function verifySync(data: string, expectedHash: string): boolean {
  return verifyJS(data, expectedHash);
}

export function normalizeSync(input: string): string {
  return normalizeJS(input);
}