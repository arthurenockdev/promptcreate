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
import { uploadProjectFiles } from '../services/supabase';
import { FileManager } from '../services/fileManager';
import FileExplorer from '../components/FileExplorer';

export default function CreatePage() {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentFiles, setCurrentFiles] = useState({});
  const [webContainerInstance, setWebContainerInstance] = useState(null);
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    theme: '',
    type: ''
  });
  const [selectedFile, setSelectedFile] = useState('app/page.js');
  const [fileContent, setFileContent] = useState('');
  const [isEnvironmentReady, setIsEnvironmentReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [setupStep, setSetupStep] = useState('name'); // 'name', 'description', 'ready'
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const fileManager = useRef(null);
  const chatRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddon = useRef(null);
  const shellProcess = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize chat with project setup questions
  useEffect(() => {
    setChatMessages([{
      role: 'assistant',
      content: 'Let\'s set up your project! What would you like to name it? (optional)'
    }]);
  }, []);

  const handleFileSelect = async (path) => {
    try {
      if (!fileManager.current) {
        throw new Error('File manager is not initialized');
      }
      if (!path) {
        throw new Error('No file path provided');
      }

      const content = await fileManager.current.readFile(path);
      setSelectedFile(path);
      setFileContent(content);
      fileManager.current.setCurrentFile(path);
    } catch (error) {
      console.error('Error selecting file:', error);
      setError(`Failed to open file: ${error.message}`);
      // Keep the previous file selected on error
      setSelectedFile(prevSelectedFile => prevSelectedFile);
    }
  };

  const handleEditorChange = async (value) => {
    try {
      if (!fileManager.current) {
        throw new Error('File manager is not initialized');
      }
      if (!selectedFile) {
        throw new Error('No file is currently selected');
      }
      if (typeof value !== 'string') {
        throw new Error('Invalid file content');
      }

      await fileManager.current.writeFile(selectedFile, value);
    } catch (error) {
      console.error('Error saving file:', error);
      setError(`Failed to save file: ${error.message}`);
    }
  };

  const initializeNextJsEnvironment = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Check if WebContainer is ready
      if (!webContainerInstance) {
        throw new Error('WebContainer is not initialized');
      }

      terminalInstance.current?.write('\r\n\x1b[36m> Creating project files...\x1b[0m\r\n');
      
      // Create project files
      const files = await createNextJsFiles(projectDetails.name);
      
      // Initialize file manager
      if (!fileManager.current) {
        fileManager.current = new FileManager(webContainerInstance);
        fileManager.current.setOnFilesChange(setCurrentFiles);
      }
      
      terminalInstance.current?.write('\r\n\x1b[36m> Initializing project...\x1b[0m\r\n');
      
      // Initialize project in file manager
      await fileManager.current.initialize(projectDetails.name || 'nextjs-project', files);
      
      // Mount files to WebContainer
      await mountFiles(files);
      
      // Start auto-save
      fileManager.current.startAutoSave();

      terminalInstance.current?.write('\r\n\x1b[36m> Installing dependencies...\x1b[0m\r\n');
      
      // Install dependencies
      const exitCode = await installDependencies(terminalInstance.current);
      if (exitCode !== 0) {
        throw new Error('Failed to install dependencies');
      }

      // Start the development server
      await startDevServer(terminalInstance.current);
      
      // Set initial file content
      const initialContent = await fileManager.current.readFile('app/page.js');
      setFileContent(initialContent);
      
      setLoading(false);
      setIsEnvironmentReady(true);
      
      terminalInstance.current?.write('\r\n\x1b[32m> Project setup complete!\x1b[0m\r\n');
    } catch (error) {
      console.error('Failed to initialize Next.js environment:', error);
      setLoading(false);
      setError(`Failed to initialize environment: ${error.message}`);
      
      // Write error to terminal
      terminalInstance.current?.write(`\r\n\x1b[31m> Error: ${error.message}\x1b[0m\r\n`);
      
      // Clean up on error
      if (fileManager.current) {
        fileManager.current.stopAutoSave();
      }
      cleanup();
    }
  };

  useEffect(() => {
    const initializeEnvironment = async () => {
      if (typeof window !== 'undefined' && !terminalInstance.current) {
        try {
          // Initialize terminal
          terminalInstance.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'monospace',
            theme: {
              background: '#1e1e1e',
              foreground: '#ffffff'
            }
          });

          // Initialize fit addon
          fitAddon.current = new FitAddon();
          terminalInstance.current.loadAddon(fitAddon.current);

          // Open terminal
          const terminalElement = document.getElementById('terminal');
          if (!terminalElement) {
            throw new Error('Terminal element not found');
          }
          terminalInstance.current.open(terminalElement);
          
          // Initial fit
          setTimeout(() => {
            if (fitAddon.current) {
              try {
                fitAddon.current.fit();
              } catch (e) {
                console.warn('Failed to fit terminal:', e);
              }
            }
          }, 100);

          // Initialize WebContainer
          const container = await initWebContainer();
          if (!container) {
            throw new Error('Failed to initialize WebContainer');
          }
          setWebContainerInstance(container);
          
          // Write success message to terminal
          terminalInstance.current.write('\r\n\x1b[32m> Environment ready!\x1b[0m\r\n');
          setIsEnvironmentReady(true);

          // Handle window resize
          const handleResize = () => {
            if (fitAddon.current) {
              try {
                fitAddon.current.fit();
              } catch (e) {
                console.warn('Failed to fit terminal:', e);
              }
            }
          };

          window.addEventListener('resize', handleResize);
          return () => {
            window.removeEventListener('resize', handleResize);
            if (terminalInstance.current) {
              terminalInstance.current.dispose();
            }
            cleanup();
          };
        } catch (err) {
          console.error('Failed to initialize environment:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeEnvironment();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGenerating) return;
    
    const userMessage = input.trim();
    if (!userMessage) return;

    if (setupStep !== 'ready') {
      handleSetupResponse(userMessage);
    } else {
      const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
      setChatMessages(newMessages);
      
      try {
        // Check if this is a project initialization request
        if (userMessage.toLowerCase().includes('create') && userMessage.toLowerCase().includes('next.js')) {
          const projectName = userMessage.match(/project name[:\s]+([^\s]+)/i)?.[1] || 'my-app';
          const theme = userMessage.match(/theme[:\s]+([^\s]+)/i)?.[1] || 'default';
          
          setProjectDetails(prev => ({ ...prev, name: projectName, theme }));
          await initializeNextJsEnvironment();
          
          setChatMessages([...newMessages, { 
            role: 'assistant', 
            content: `I've set up your Next.js project with name: ${projectName} and theme: ${theme}. You can now start building your application!` 
          }]);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSetupResponse = async (response) => {
    try {
      switch (setupStep) {
        case 'name':
          setProjectDetails(prev => ({ ...prev, name: response || 'nextjs-project' }));
          setSetupStep('description');
          setChatMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: "Great! Now, please describe what you'd like to build. This will help me set up the appropriate files and dependencies."
            }
          ]);
          break;
        
        case 'description':
          setProjectDetails(prev => ({ ...prev, description: response }));
          setSetupStep('ready');
          try {
            setLoading(true);
            await initializeNextJsEnvironment();
            setChatMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: "I've set up your Next.js environment based on your description. You can now start building your application! Let me know if you need any help."
              }
            ]);
          } catch (error) {
            setChatMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: `Failed to initialize the environment: ${error.message}. Please try again.`
              }
            ]);
          } finally {
            setLoading(false);
          }
          break;
      }
    } catch (error) {
      console.error('Error in setup:', error);
      setError(`Setup failed: ${error.message}`);
    }
  };

  const mountFiles = async (files) => {
    try {
      await webContainerInstance.mount(files);
    } catch (error) {
      console.error('Failed to mount files:', error);
      throw new Error('Failed to mount project files');
    }
  };

  const installDependencies = async (terminal) => {
    try {
      const installProcess = await webContainerInstance.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal?.write(data);
          }
        })
      );
      
      return await installProcess.exit;
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      throw new Error('Failed to install project dependencies');
    }
  };

  const startDevServer = async (terminal) => {
    try {
      const serverProcess = await webContainerInstance.spawn('npm', ['run', 'dev']);
      
      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal?.write(data);
          }
        })
      );
      
      // Wait for server to be ready
      await new Promise((resolve) => {
        let buffer = '';
        const textDecoder = new TextDecoder();
        
        const readableStream = serverProcess.output.pipeThrough(
          new TransformStream({
            transform(chunk, controller) {
              buffer += textDecoder.decode(chunk);
              if (buffer.includes('Ready')) {
                resolve();
                controller.terminate();
              }
            },
          })
        );
      });
    } catch (error) {
      console.error('Failed to start development server:', error);
      throw new Error('Failed to start development server');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 border-r border-gray-700">
          <FileExplorer
            files={currentFiles}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>

        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={fileContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          </div>

          {/* Terminal */}
          <div className="h-1/3 bg-black p-2">
            <div id="terminal" className="h-full"></div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="w-96 border-l border-gray-700 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4" ref={chatRef}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === 'assistant' ? 'text-blue-400' : 'text-green-400'
                }`}
              >
                <strong>{message.role === 'assistant' ? 'AI: ' : 'You: '}</strong>
                {message.content}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <div className="text-white mt-2">Setting up your environment...</div>
          </div>
        </div>
      )}
    </div>
  );
}
