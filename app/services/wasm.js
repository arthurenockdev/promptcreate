// Simple WebAssembly runtime manager
let wasmInstance = null;

export async function initWASM() {
  if (!wasmInstance) {
    // Initialize with default memory
    const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
    
    // Create import object with basic browser APIs
    const imports = {
      env: {
        memory,
        abort: () => console.error('Wasm aborted'),
      },
      wasi_snapshot_preview1: {
        proc_exit: (code) => {
          if (code !== 0) {
            throw new Error(`WASM exited with code ${code}`);
          }
        },
        fd_write: () => 0, // Stub for file descriptor write
        fd_close: () => 0, // Stub for file descriptor close
        fd_seek: () => 0,  // Stub for file descriptor seek
        fd_read: () => 0,  // Stub for file descriptor read
      }
    };

    return { imports, memory };
  }
  return wasmInstance;
}

export async function runWasmModule(wasmBytes, imports = {}) {
  try {
    const { imports: defaultImports, memory } = await initWASM();
    
    // Compile and instantiate the WebAssembly module
    const module = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(module, {
      ...defaultImports,
      ...imports
    });

    wasmInstance = instance;
    
    return {
      instance,
      memory
    };
  } catch (error) {
    console.error('Error running WASM module:', error);
    throw error;
  }
}

export async function cleanupWASI() {
  wasmInstance = null;
}
