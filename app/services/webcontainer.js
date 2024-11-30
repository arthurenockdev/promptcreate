'use client';

import { WebContainer } from '@webcontainer/api';

let webcontainerInstance = null;
let isInitializing = false;
let initPromise = null;
let serverProcess = null;

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
      // Check if headers are set correctly
      if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
        throw new Error('Cross-Origin Isolation is not enabled. Please ensure COOP and COEP headers are set.');
      }

      // Initialize WebContainer
      webcontainerInstance = await WebContainer.boot();
      
      // Set up basic file system
      await webcontainerInstance.mount({
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: 'my-app',
              type: 'module',
              scripts: {
                start: 'next dev'
              }
            })
          }
        }
      });

      return webcontainerInstance;
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      // Reset state on error
      webcontainerInstance = null;
      isInitializing = false;
      initPromise = null;
      throw new Error(`Failed to initialize development environment: ${error.message}`);
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
    // Transform files into the correct format
    const mountFiles = {};
    for (const [path, content] of Object.entries(files)) {
      mountFiles[path] = {
        file: {
          contents: content
        }
      };
    }
    
    await instance.mount(mountFiles);
  } catch (error) {
    console.error('Failed to mount files:', error);
    throw new Error(`Failed to set up project files: ${error.message}`);
  }
}

export async function installDependencies(terminal) {
  const instance = await initWebContainer();
  try {
    terminal.write('\r\nInstalling dependencies...\r\n');
    
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
    
    terminal.write('\r\nDependencies installed successfully!\r\n');
    return exitCode;
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    throw new Error(`Failed to install project dependencies: ${error.message}`);
  }
}

export async function startDevServer(terminal) {
  const instance = await initWebContainer();
  try {
    // Kill existing server process if any
    if (serverProcess) {
      try {
        await serverProcess.kill();
      } catch (error) {
        console.warn('Failed to kill previous server process:', error);
      }
    }

    terminal.write('\r\nStarting development server...\r\n');
    
    serverProcess = await instance.spawn('npm', ['run', 'start']);
    
    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
          
          // Check for server ready message
          if (data.includes('ready') && data.includes('http')) {
            const match = data.match(/http:\/\/localhost:(\d+)/);
            if (match && match[1]) {
              const port = match[1];
              window.dispatchEvent(new CustomEvent('server-ready', { detail: { port } }));
            }
          }
        },
      })
    );

    return serverProcess;
  } catch (error) {
    console.error('Failed to start dev server:', error);
    throw new Error(`Failed to start development server: ${error.message}`);
  }
}

export async function startShell(terminal) {
  const instance = await initWebContainer();
  try {
    const shellProcess = await instance.spawn('jsh', {
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

    const input = shellProcess.input.getWriter();
    terminal.onData((data) => {
      input.write(data);
    });

    return shellProcess;
  } catch (error) {
    console.error('Failed to start shell:', error);
    throw new Error(`Failed to start development shell: ${error.message}`);
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

export async function readFile(path) {
  const instance = await initWebContainer();
  try {
    const contents = await instance.fs.readFile(path);
    return contents.toString();
  } catch (error) {
    console.error('Failed to read file:', error);
    throw new Error(`Failed to read file ${path}: ${error.message}`);
  }
}

export function onServerReady(callback) {
  window.addEventListener('server-ready', (event) => {
    callback(event.detail.port);
  });
}

export async function cleanup() {
  try {
    if (serverProcess) {
      await serverProcess.kill();
      serverProcess = null;
    }
    
    if (webcontainerInstance) {
      await webcontainerInstance.teardown();
      webcontainerInstance = null;
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
