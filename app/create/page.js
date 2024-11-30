'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Editor from '@monaco-editor/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

import {
  initWebContainer,
  mountFiles,
  installDependencies,
  startDevServer,
  startShell,
  writeFile,
  onServerReady,
  cleanup
} from '../services/webcontainer';
import { generateCode } from '../services/gemini';

export default function CreatePage() {
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'What type of application would you like to build? I can help you create:\n\n1. Next.js applications\n2. Express.js APIs\n\nDescribe your project and its features!' }
  ]);
  const [input, setInput] = useState('');
  const [currentFiles, setCurrentFiles] = useState({});
  const [activeFile, setActiveFile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnvironmentReady, setIsEnvironmentReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/loading.html');
  const terminalRef = useRef(null);
  const chatRef = useRef(null);
  const terminalInstance = useRef(null);
  const shellProcess = useRef(null);
  const fitAddonInstance = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let term = null;
    let fitAddon = null;

    const initializeTerminal = async () => {
      if (!terminalRef.current || !isMounted) return;

      try {
        // Create terminal instance
        term = new Terminal({
          convertEol: true,
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          lineHeight: 1.2,
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4',
            selection: '#264f78',
            black: '#1e1e1e',
            brightBlack: '#808080',
            red: '#f44747',
            brightRed: '#f55757',
            green: '#6a9955',
            brightGreen: '#7ec375',
            yellow: '#d7ba7d',
            brightYellow: '#e7cb93',
            blue: '#569cd6',
            brightBlue: '#66a9e0',
            magenta: '#c586c0',
            brightMagenta: '#d8a6d4',
            cyan: '#4dc9b0',
            brightCyan: '#5fcfbb',
            white: '#d4d4d4',
            brightWhite: '#ffffff'
          }
        });

        // Create and load FitAddon
        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        // Open terminal in the container
        term.open(terminalRef.current);
        
        // Store instances after successful initialization
        terminalInstance.current = term;
        fitAddonInstance.current = fitAddon;
        
        // Fit terminal to container
        fitAddon.fit();

        // Initialize environment
        term.write('Initializing development environment...\r\n');

        // Initialize WebContainer
        await initWebContainer();
        term.write('WebContainer initialized successfully.\r\n');

        // Start shell
        const shell = await startShell(term);
        shellProcess.current = shell;
        term.write('Shell started successfully.\r\n');

        // Mark environment as ready
        setIsEnvironmentReady(true);
        term.write('Development environment is ready!\r\n\n');

        // Listen for server ready event
        onServerReady((port) => {
          if (isMounted) {
            const url = `http://localhost:${port}`;
            setPreviewUrl(url);
            term.write(`\r\nServer is running at ${url}\r\n`);
          }
        });
      } catch (err) {
        console.error('Terminal initialization error:', err);
        setError(err.message);
        if (term) {
          term.write('\r\n\x1b[31mError: Failed to initialize terminal.\x1b[0m\r\n');
          term.write(err.message + '\r\n');
        }
      }
    };

    // Handle window resize
    const handleResize = () => {
      if (fitAddonInstance.current && terminalInstance.current) {
        try {
          fitAddonInstance.current.fit();
          if (shellProcess.current) {
            shellProcess.current.resize({
              cols: terminalInstance.current.cols,
              rows: terminalInstance.current.rows,
            });
          }
        } catch (error) {
          console.error('Error resizing terminal:', error);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    initializeTerminal();

    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      
      // Cleanup terminal
      if (terminalInstance.current) {
        try {
          // Dispose shell process first
          if (shellProcess.current) {
            shellProcess.current.kill();
          }
          
          // Clear terminal content and dispose
          terminalInstance.current.clear();
          terminalInstance.current.dispose();
          
          // Dispose FitAddon
          if (fitAddonInstance.current) {
            fitAddonInstance.current.dispose();
          }
        } catch (err) {
          console.error('Error disposing terminal:', err);
        }
      }
      
      // Reset refs
      terminalInstance.current = null;
      fitAddonInstance.current = null;
      shellProcess.current = null;
      
      // Cleanup WebContainer
      cleanup();
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleGenerateCode = async () => {
    if (!input.trim() || !terminalInstance.current || !isEnvironmentReady) {
      if (!isEnvironmentReady) {
        terminalInstance.current?.write('\r\n\x1b[33mPlease wait for the development environment to finish initializing.\x1b[0m\r\n');
      }
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      terminalInstance.current.write('\r\nAnalyzing your request...\r\n');
      
      // Add user message
      setChatMessages(prev => [...prev, { role: 'user', content: input }]);
      
      // Generate code
      const response = await generateCode('nextjs', input);
      
      if (!response || !response.files) {
        throw new Error('Invalid response from code generation');
      }

      // Setup files
      terminalInstance.current.write('Setting up project files...\r\n');
      await mountFiles(response.files);
      setCurrentFiles(response.files);

      // Set active file
      const firstFile = Object.keys(response.files)[0];
      if (firstFile) {
        setActiveFile(firstFile);
      }

      // Install dependencies
      terminalInstance.current.write('Installing dependencies...\r\n');
      const exitCode = await installDependencies(terminalInstance.current);
      if (exitCode !== 0) {
        throw new Error('Failed to install dependencies');
      }

      // Start development server
      terminalInstance.current.write('Starting development server...\r\n');
      await startDevServer(terminalInstance.current);

      // Add success message
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I have generated your application! You can now:\n\n' +
                '1. View and edit the code in the editor\n' +
                '2. See the running application in the preview window\n' +
                '3. Use the terminal for additional commands\n\n' +
                'Let me know if you need any changes or have questions!'
      }]);
    } catch (err) {
      console.error('Code generation error:', err);
      setError(err.message);
      
      if (terminalInstance.current) {
        terminalInstance.current.write(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error while setting up your project: ${err.message}\n\nPlease try again or provide more details about what you'd like to build.`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    
    const userInput = input;
    setInput('');
    await handleGenerateCode();
  };

  return (
    <div className="container">
      <div className="editor">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          path={activeFile}
          value={currentFiles[activeFile]?.content || '// Your code will appear here'}
          options={{
            readOnly: isGenerating,
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on'
          }}
        />
      </div>

      <div className="preview">
        <iframe
          src={previewUrl}
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="cross-origin-isolated"
        />
      </div>

      <div className="terminal" ref={terminalRef}>
        {error && (
          <div className="terminal-error">
            {error}
          </div>
        )}
      </div>

      <div className="chat">
        <div className="chat-messages" ref={chatRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the application you want to build..."
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button type="submit" disabled={isGenerating || !input.trim()}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>
    </div>
  );
}
