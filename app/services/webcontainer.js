'use client';

// Polyfill self for xterm
if (typeof self === 'undefined' && typeof global !== 'undefined') {
  global.self = global;
}

import { WebContainer } from '@webcontainer/api';

let webcontainerInstance;
let serverUrl;
let isInitializing = false;
let initPromise = null;

export async function initWebContainer() {
  // Return existing instance if available
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  // Return existing initialization promise if one is in progress
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('WebContainer can only be initialized in a browser environment');
      }

      // Check if headers are set correctly
      if (!window.crossOriginIsolated) {
        throw new Error('Cross-Origin Isolation is not enabled. Please ensure COOP and COEP headers are set.');
      }

      // Initialize WebContainer with timeout
      const bootPromise = WebContainer.boot();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('WebContainer initialization timed out')), 30000)
      );

      webcontainerInstance = await Promise.race([bootPromise, timeoutPromise]);

      // Add error handler
      webcontainerInstance.on('error', (error) => {
        console.error('WebContainer error:', error);
        cleanup();
      });

      return webcontainerInstance;
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      // Reset state on error
      cleanup();
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
}

export function cleanup() {
  if (webcontainerInstance) {
    try {
      // Stop any running processes
      webcontainerInstance.teardown().catch(console.error);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
  
  // Reset all state
  webcontainerInstance = null;
  serverUrl = null;
  isInitializing = false;
  initPromise = null;
}

export async function mountFiles(files) {
  const instance = await initWebContainer();
  try {
    // Ensure directory structure
    const processFiles = async (fileTree, parentPath = '') => {
      for (const [name, content] of Object.entries(fileTree)) {
        const path = parentPath ? `${parentPath}/${name}` : name;
        
        if (content.directory) {
          // Create directory
          await instance.fs.mkdir(path, { recursive: true });
          // Process directory contents
          await processFiles(content.directory, path);
        } else if (content.file) {
          // Create parent directories if they don't exist
          const dirPath = path.split('/').slice(0, -1).join('/');
          if (dirPath) {
            await instance.fs.mkdir(dirPath, { recursive: true });
          }
          // Write file
          await instance.fs.writeFile(path, content.file.contents);
        }
      }
    };

    await processFiles(files);
  } catch (error) {
    console.error('Failed to mount files:', error);
    throw new Error(`Failed to mount files: ${error.message}`);
  }
}

export async function writeFile(path, contents) {
  const instance = await initWebContainer();
  try {
    await instance.fs.writeFile(path, contents);
  } catch (error) {
    console.error('Failed to write file:', error);
    throw new Error(`Failed to write file ${path}: ${error.message}`);
  }
}

export async function startShell(terminal) {
  const instance = await initWebContainer();
  try {
    const shellProcess = await instance.spawn('bash', {
      terminal: {
        cols: terminal.cols,
        rows: terminal.rows,
      },
    });

    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      })
    );

    return shellProcess;
  } catch (error) {
    console.error('Failed to start shell:', error);
    throw new Error(`Failed to start shell: ${error.message}`);
  }
}

export async function installDependencies(terminal) {
  const instance = await initWebContainer();
  try {
    // Install dependencies
    const installProcess = await instance.spawn('npm', ['install']);
    
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      })
    );

    const exitCode = await installProcess.exit;
    if (exitCode !== 0) {
      throw new Error(`npm install failed with exit code ${exitCode}`);
    }
    return exitCode;
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

export async function startDevServer(terminal) {
  try {
    const instance = await initWebContainer();
    
    // Kill any existing processes
    try {
      const processes = await instance.ps();
      for (const proc of processes) {
        try {
          await proc.kill();
        } catch (e) {
          console.warn('Failed to kill process:', e);
        }
      }
    } catch (e) {
      console.warn('Failed to list processes:', e);
    }

    // Start the server
    terminal?.write('\r\n\x1b[36m> Starting development server...\x1b[0m\r\n');
    
    const serverProcess = await instance.spawn('npm', ['run', 'dev']);
    
    return new Promise((resolve, reject) => {
      let buffer = '';
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timed out after 60 seconds'));
      }, 60000);

      // Handle server output
      serverProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            // Write to terminal
            terminal?.write(chunk);
            
            // Add to buffer for analysis
            buffer += new TextDecoder().decode(chunk, { stream: true });
            
            // Check for success patterns
            if (
              buffer.includes('ready') || 
              buffer.includes('started server') ||
              buffer.includes('localhost:3000') ||
              buffer.includes('http://localhost')
            ) {
              clearTimeout(timeout);
              resolve();
            }
            
            // Check for error patterns
            if (
              buffer.includes('ERR_MODULE_NOT_FOUND') ||
              buffer.includes('Failed to compile') ||
              buffer.includes('EADDRINUSE') ||
              (buffer.includes('Error:') && !buffer.includes('TS Error'))
            ) {
              clearTimeout(timeout);
              const errorMatch = buffer.match(/Error:([^\n]*)/);
              const errorMessage = errorMatch ? errorMatch[1].trim() : 'Unknown error';
              reject(new Error(`Server failed to start: ${errorMessage}`));
            }
          },
          close() {
            console.log('Server process stream closed');
          },
          abort(reason) {
            reject(new Error(`Server process aborted: ${reason}`));
          }
        })
      ).catch(error => {
        reject(new Error(`Failed to handle server output: ${error.message}`));
      });

      // Handle server error stream
      serverProcess.stderr.pipeTo(
        new WritableStream({
          write(chunk) {
            const text = new TextDecoder().decode(chunk, { stream: true });
            terminal?.write(`\x1b[31m${text}\x1b[0m`);
            
            if (text.includes('Error:')) {
              clearTimeout(timeout);
              reject(new Error(`Server error: ${text.trim()}`));
            }
          }
        })
      ).catch(error => {
        console.warn('Failed to handle server errors:', error);
      });
    });
  } catch (error) {
    console.error('Failed to start development server:', error);
    throw new Error(`Failed to start development server: ${error.message}`);
  }
}

export function onServerReady(callback) {
  if (serverUrl) {
    callback(serverUrl);
  }
  
  // Listen for server ready event
  webcontainerInstance?.on('server-ready', (port, url) => {
    serverUrl = url;
    callback(url);
  });
}
