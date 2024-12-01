'use client';

import { useState, useEffect, useRef } from 'react';
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
import { createNextJsFiles } from '../utils/nextjs-init';

export default function CreatePage() {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentFiles, setCurrentFiles] = useState({});
  const [activeFile, setActiveFile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnvironmentReady, setIsEnvironmentReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/loading.html');
  const [activeTab, setActiveTab] = useState('preview');
  const [isDragging, setIsDragging] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    theme: '',
    type: ''
  });
  const [setupStep, setSetupStep] = useState('name'); // 'name', 'theme', 'type', 'ready'
  const terminalRef = useRef(null);
  const chatRef = useRef(null);
  const terminalInstance = useRef(null);
  const shellProcess = useRef(null);
  const fitAddonInstance = useRef(null);
  const [error, setError] = useState(null);

  // Initialize chat with project setup questions
  useEffect(() => {
    setChatMessages([{
      role: 'assistant',
      content: "Welcome! Let's set up your development environment. First, what would you like to name your project? (Press Enter to use default name 'my-app')"
    }]);
  }, []);

  // Handle project setup flow
  const handleSetupResponse = async (response) => {
    switch (setupStep) {
      case 'name':
        setProjectDetails(prev => ({ 
          ...prev, 
          name: response.trim() || 'my-app'
        }));
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: response || 'my-app' },
          { role: 'assistant', content: "Great! Now, what theme would you like for your app? Choose from:\n1. Light\n2. Dark\n3. System (adapts to user's preference)\n(Press Enter for default 'System' theme)" }
        ]);
        setSetupStep('theme');
        break;

      case 'theme':
        const theme = response.trim().toLowerCase();
        let selectedTheme = 'system';
        if (theme.includes('light')) selectedTheme = 'light';
        if (theme.includes('dark')) selectedTheme = 'dark';
        
        setProjectDetails(prev => ({ ...prev, theme: selectedTheme }));
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: response || 'system' },
          { role: 'assistant', content: "Perfect! I've initialized a Next.js environment for you. What type of application would you like to build? Here are some suggestions:\n\n1. Web Application (e.g., Dashboard, Blog, E-commerce)\n2. API Service\n3. Full-Stack Application\n\nDescribe your project and I'll help you get started!" }
        ]);
        setSetupStep('ready');
        
        // Initialize Next.js environment
        initializeNextJsEnvironment();
        break;

      case 'ready':
        handleGenerateCode();
        break;
    }
  };

  async function initializeNextJsProject(projectName, theme) {
    try {
      // Initialize WebContainer
      const container = await initWebContainer();
      
      // Create Next.js files
      const files = createNextJsFiles(projectName, theme);
      await mountFiles(files);
      
      // Install dependencies
      await installDependencies(terminalInstance.current);
      
      // Start development server
      await startDevServer(terminalInstance.current);
      
      // Return success message
      return `Successfully initialized Next.js project: ${projectName}`;
    } catch (error) {
      console.error('Failed to initialize Next.js project:', error);
      throw new Error(`Failed to initialize Next.js project: ${error.message}`);
    }
  }

  const initializeNextJsEnvironment = async () => {
    if (terminalInstance.current) {
      terminalInstance.current.write('\r\n\x1b[32m> Initializing Next.js environment...\x1b[0m\r\n');
      
      // Create package.json
      const packageJson = {
        name: projectDetails.name,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'tailwindcss': '^3.3.0',
          'autoprefixer': '^10.4.0',
          'postcss': '^8.4.0'
        }
      };

      // Create initial files
      const files = {
        'package.json': {
          file: {
            contents: JSON.stringify(packageJson, null, 2)
          }
        },
        'next.config.js': {
          file: {
            contents: 'module.exports = { reactStrictMode: true };'
          }
        },
        'postcss.config.js': {
          file: {
            contents: 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };'
          }
        },
        'tailwind.config.js': {
          file: {
            contents: `
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: '${projectDetails.theme === 'system' ? 'class' : projectDetails.theme}'
};`
          }
        },
        'app/layout.js': {
          file: {
            contents: `
import './globals.css';

export const metadata = {
  title: '${projectDetails.name}',
  description: 'Created with PromptCreate',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="${projectDetails.theme === 'dark' ? 'dark' : ''}">
      <body>{children}</body>
    </html>
  );
}`
          }
        },
        'app/globals.css': {
          file: {
            contents: `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}`
          }
        },
        'app/page.js': {
          file: {
            contents: `
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Welcome to ${projectDetails.name}</h1>
        <p className="mt-4 text-lg">Start building your application!</p>
      </div>
    </main>
  );
}`
          }
        }
      };

      try {
        // Mount files
        await mountFiles(files);
        
        // Install dependencies
        terminalInstance.current.write('\r\n\x1b[32m> Installing dependencies...\x1b[0m\r\n');
        await installDependencies(terminalInstance.current);
        
        // Start development server
        terminalInstance.current.write('\r\n\x1b[32m> Starting development server...\x1b[0m\r\n');
        await startDevServer(terminalInstance.current);
        
        setCurrentFiles(files);
        setActiveFile('app/page.js');
        setIsEnvironmentReady(true);
      } catch (err) {
        console.error('Environment setup error:', err);
        setError(`Failed to initialize environment: ${err.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isGenerating) return;
    
    const userMessage = input.trim();
    if (!userMessage) return;

    if (setupStep !== 'ready') {
      handleSetupResponse(input);
    } else {
      const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
      setChatMessages(newMessages);
      
      try {
        // Check if this is a project initialization request
        if (userMessage.toLowerCase().includes('create') && userMessage.toLowerCase().includes('next.js')) {
          const projectName = userMessage.match(/project name[:\s]+([^\s]+)/i)?.[1] || 'my-app';
          const theme = userMessage.match(/theme[:\s]+([^\s]+)/i)?.[1] || 'default';
          
          const result = await initializeNextJsProject(projectName, theme);
          setChatMessages([...newMessages, { role: 'assistant', content: result }]);
        } else {
          await handleGenerateCode();
        }
      } catch (error) {
        console.error('Error:', error);
        setChatMessages([...newMessages, { role: 'assistant', content: `Error: ${error.message}` }]);
      } finally {
        setInput('');
      }
    }
  };

  const handleGenerateCode = async () => {
    if (!input.trim() || !terminalInstance.current || !isEnvironmentReady) {
      if (!isEnvironmentReady) {
        terminalInstance.current?.write('\r\n\x1b[33mPlease wait for the development environment to finish initializing.\x1b[0m\r\n');
      }
      return;
    }

    setIsGenerating(true);
    try {
      // Call our server-side API route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate response');
      }

      // Update chat messages
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.text }
      ]);

      // Process any code generation commands in the response
      if (data.text.includes('```')) {
        const codeBlocks = data.text.match(/\`\`\`[\s\S]+?\`\`\`/g) || [];
        for (const block of codeBlocks) {
          const code = block.replace(/\`\`\`(\w+)?\n/, '').replace(/\`\`\`$/, '');
          console.log('Processing code block:', code);
        }
      }

    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(`Failed to generate code: ${errorMessage}`);
      console.error('Generation error:', err);
      
      // Add error message to chat
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: `I encountered an error: ${errorMessage}\n\nPlease try again or provide more details about what you'd like to build.` }
      ]);
    } finally {
      setIsGenerating(false);
      setInput('');
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const workspace = document.querySelector('.workspace');
    const percentage = (e.clientX / workspace.offsetWidth) * 100;
    
    // Limit the split position between 20% and 80%
    const limitedPercentage = Math.min(Math.max(percentage, 20), 80);
    setSplitPosition(limitedPercentage);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="workspace">
      {/* Left side - Chat */}
      <div className="chat-section" style={{ width: `${splitPosition}%` }}>
        <div className="chat-messages" ref={chatRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your application..."
            disabled={isGenerating}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={isGenerating || !input.trim()}
            className="chat-submit"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      {/* Resizer */}
      <div 
        className="resizer"
        onMouseDown={handleMouseDown}
        style={{ left: `${splitPosition}%` }}
      />

      {/* Right side - Workspace */}
      <div className="workspace-section" style={{ width: `${100 - splitPosition}%` }}>
        {/* Tabs */}
        <div className="workspace-tabs">
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button
            className={`tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            Terminal
          </button>
        </div>

        {/* Tab content */}
        <div className="workspace-content">
          <div className={`preview-container ${activeTab === 'preview' ? 'active' : ''}`}>
            <iframe
              src={previewUrl}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              allow="cross-origin-isolated"
            />
          </div>
          <div className={`editor-container ${activeTab === 'editor' ? 'active' : ''}`}>
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
          <div className={`terminal-container ${activeTab === 'terminal' ? 'active' : ''}`}>
            <div ref={terminalRef} className="terminal-content">
              {error && (
                <div className="terminal-error">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
