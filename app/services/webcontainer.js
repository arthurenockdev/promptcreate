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

      // Initialize WebContainer
      webcontainerInstance = await WebContainer.boot();
      return webcontainerInstance;
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      // Reset state on error
      webcontainerInstance = null;
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
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
  const instance = await initWebContainer();
  try {
    // Start the development server
    const serverProcess = await instance.spawn('npm', ['run', 'dev']);

    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      })
    );

    // Wait for the server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timed out'));
      }, 30000); // 30 second timeout

      const checkServer = async () => {
        try {
          const response = await fetch('http://localhost:3000');
          if (response.ok) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkServer, 100);
          }
        } catch {
          setTimeout(checkServer, 100);
        }
      };
      checkServer();
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

export function cleanup() {
  if (webcontainerInstance) {
    try {
      webcontainerInstance.teardown();
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      webcontainerInstance = null;
      serverUrl = null;
      isInitializing = false;
      initPromise = null;
    }
  }
}
