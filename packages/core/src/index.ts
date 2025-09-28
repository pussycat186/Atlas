let wasmModule: any = null;

// JS fallback implementations
function hashJS(input: string): string {
  // Simple hash fallback - in production use crypto.subtle
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

// WASM loader
async function loadWasm() {
  if (wasmModule) return wasmModule;
  
  try {
    if (typeof window !== 'undefined') {
      // Browser
      const wasm = await import('@atlas/core-wasm');
      wasmModule = wasm;
      return wasm;
    } else {
      // Node.js
      const wasm = await import('@atlas/core-wasm');
      wasmModule = wasm;
      return wasm;
    }
  } catch (error) {
    console.warn('WASM module failed to load, using JS fallback:', error);
    return null;
  }
}

export async function hash(input: string): Promise<string> {
  const wasm = await loadWasm();
  return wasm ? wasm.hash(input) : hashJS(input);
}

export async function verify(data: string, expectedHash: string): Promise<boolean> {
  const wasm = await loadWasm();
  return wasm ? wasm.verify(data, expectedHash) : verifyJS(data, expectedHash);
}

export async function normalize(input: string): Promise<string> {
  const wasm = await loadWasm();
  return wasm ? wasm.normalize(input) : normalizeJS(input);
}

// Sync versions for when WASM is already loaded
export function hashSync(input: string): string {
  return wasmModule ? wasmModule.hash(input) : hashJS(input);
}

export function verifySync(data: string, expectedHash: string): boolean {
  return wasmModule ? wasmModule.verify(data, expectedHash) : verifyJS(data, expectedHash);
}

export function normalizeSync(input: string): string {
  return wasmModule ? wasmModule.normalize(input) : normalizeJS(input);
}