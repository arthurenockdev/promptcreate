'use client';

import { WebContainer } from '@webcontainer/api';

let webcontainerInstance;
let serverUrl;

export async function initWebContainer() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}

export async function mountFiles(files) {
  if (!webcontainerInstance) {
    await initWebContainer();
  }
  await webcontainerInstance.mount(files);
}

export async function writeFile(path, contents) {
  if (!webcontainerInstance) {
    throw new Error('WebContainer not initialized');
  }
  await webcontainerInstance.fs.writeFile(path, contents);
}

export async function startShell(terminal) {
  if (!webcontainerInstance) {
    throw new Error('WebContainer not initialized');
  }

  const shellProcess = await webcontainerInstance.spawn('bash', {
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
}

export async function installDependencies(terminal) {
  if (!webcontainerInstance) {
    throw new Error('WebContainer not initialized');
  }

  // Install dependencies
  const installProcess = await webcontainerInstance.spawn('npm', ['install']);
  
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    })
  );

  const exitCode = await installProcess.exit;
  return exitCode;
}

export async function startDevServer(terminal) {
  if (!webcontainerInstance) {
    throw new Error('WebContainer not initialized');
  }

  // Start the development server
  const serverProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);

  serverProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    })
  );

  // Wait for the server to be ready
  await new Promise((resolve) => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:3000');
        if (response.ok) {
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
    webcontainerInstance.teardown();
    webcontainerInstance = null;
    serverUrl = null;
  }
}
