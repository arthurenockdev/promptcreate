export const createNextJsFiles = (projectName = 'my-app', theme = 'default') => {
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'tailwindcss': '^3.3.0',
      'postcss': '^8.4.0',
      'autoprefixer': '^10.4.0'
    }
  };

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`;

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  const layoutContent = `import './globals.css'
 
export const metadata = {
  title: '${projectName}',
  description: 'Created with PromptCreate',
}
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;

  const pageContent = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">Welcome to ${projectName}</h1>
        <p className="mt-4 text-xl">Get started by editing app/page.js</p>
      </div>
    </main>
  )
}`;

  const globalsCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`;

  return {
    'package.json': {
      file: {
        contents: JSON.stringify(packageJson, null, 2)
      }
    },
    'next.config.js': {
      file: {
        contents: nextConfig
      }
    },
    'tailwind.config.js': {
      file: {
        contents: tailwindConfig
      }
    },
    'postcss.config.js': {
      file: {
        contents: postcssConfig
      }
    },
    'app/layout.js': {
      file: {
        contents: layoutContent
      }
    },
    'app/page.js': {
      file: {
        contents: pageContent
      }
    },
    'app/globals.css': {
      file: {
        contents: globalsCSS
      }
    }
  };
};
