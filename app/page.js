import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Build Full-Stack Apps with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            Transform your ideas into production-ready applications with just a prompt. No coding experience required.
          </p>
          
          {/* CTA Button */}
          <div className="mb-20">
            <Link 
              href="/create"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-lg hover:opacity-90 transform hover:scale-105 transition duration-200 shadow-lg text-lg"
            >
              Start Building Now →
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 bg-gray-800/30 rounded-xl">
              <div className="text-blue-400 text-2xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Get your application up and running in minutes, not weeks</p>
            </div>
            <div className="p-6 bg-gray-800/30 rounded-xl">
              <div className="text-purple-400 text-2xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold mb-2">Full Stack</h3>
              <p className="text-gray-400">Complete with frontend, backend, and database setup</p>
            </div>
            <div className="p-6 bg-gray-800/30 rounded-xl">
              <div className="text-green-400 text-2xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
              <p className="text-gray-400">Built with modern best practices and security in mind</p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-32">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="text-5xl font-bold text-blue-500/20 absolute -top-8 left-1/2 -translate-x-1/2">1</div>
                <h3 className="text-xl font-semibold mb-2">Describe Your App</h3>
                <p className="text-gray-400">Tell us what you want to build in plain English</p>
              </div>
              <div className="relative">
                <div className="text-5xl font-bold text-purple-500/20 absolute -top-8 left-1/2 -translate-x-1/2">2</div>
                <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
                <p className="text-gray-400">Our AI creates your full-stack application</p>
              </div>
              <div className="relative">
                <div className="text-5xl font-bold text-green-500/20 absolute -top-8 left-1/2 -translate-x-1/2">3</div>
                <h3 className="text-xl font-semibold mb-2">Deploy & Scale</h3>
                <p className="text-gray-400">Get your application ready for production</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
