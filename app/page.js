'use client';

import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const projects = [
  {
    name: 'Johdel Machinery',
    description: 'A modern e-commerce platform with real-time inventory management, secure payment processing, and an AI-precommendation system. Features include user authentication, shopping cart, wishlists, and admin dashboard.',
    tags: ['E-commerce', 'Next.js', 'Stripe', 'Admin Dashboard'],
    gradient: 'from-emerald-600 to-blue-600',
    githubUrl: 'https://github.com/yourusername/shopvibe'
  },
  {
    name: 'RapidVid',
    description: 'A social travel app connecting solo travelers with locals and fellow adventurers worldwide. Features real-time chat, meetup planning, and local recommendations.',
    tags: ['Mobile App', 'Social', 'Travel'],
    gradient: 'from-blue-600 to-purple-600',
    githubUrl: 'https://github.com/yourusername/tripchats'
  }
];

export default function Home() {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('initial'); // 'initial', 'confirmed'

  // Handle Cal.com postMessage events
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify the message is from Cal.com
      if (event.origin !== 'https://cal.com') return;
      
      // Handle booking confirmed event
      if (event.data?.type === 'bookingSuccessful') {
        setBookingStatus('confirmed');
        // Close dialog after 5 seconds
        setTimeout(() => {
          setIsScheduleDialogOpen(false);
          // Reset status after dialog closes
          setTimeout(() => setBookingStatus('initial'), 500);
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Reset booking status when dialog closes
  useEffect(() => {
    if (!isScheduleDialogOpen) {
      setBookingStatus('initial');
    }
  }, [isScheduleDialogOpen]);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Building Scalable and Stunning Solutions
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-xl text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Transform your vision into reality at lightning speed. We craft market-ready MVPs in weeks, 
              giving you the competitive edge in today's dynamic tech landscape.
            </motion.p>
            
            <motion.div 
              className="mt-10 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                onClick={() => setIsScheduleDialogOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-shadow"
              >
                Schedule Discovery Call <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-black/50">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-gradient-to-b from-purple-900/50 to-transparent border border-purple-500/20"
              >
                <h3 className="text-xl font-bold mb-3">Complete Package</h3>
                <p className="text-gray-400">
                  Get a full-stack solution including a modern web application, 
                  conversion-optimized landing page, and SEO-ready content.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-gradient-to-b from-purple-900/50 to-transparent border border-purple-500/20"
              >
                <h3 className="text-xl font-bold mb-3">Seamless Integrations</h3>
                <p className="text-gray-400">
                  We handle all technical integrations including payment systems, 
                  authentication, and marketing tools.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-gradient-to-b from-purple-900/50 to-transparent border border-purple-500/20"
              >
                <h3 className="text-xl font-bold mb-3">Future-Proof Tech</h3>
                <p className="text-gray-400">
                  Built with cutting-edge technologies and AI capabilities for 
                  scalability and performance.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">A Glimpse Into My Work</h2>
              <p className="text-xl text-gray-400">Here are some of the MVPs I've helped founders launch.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl overflow-hidden bg-gradient-to-b from-purple-900/50 to-transparent border border-purple-500/20"
                >
                  <div className={`aspect-video bg-gradient-to-br ${project.gradient} flex items-center justify-center`}>
                    <h3 className="text-3xl font-bold">{project.name}</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                    <p className="text-gray-400 mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-purple-500/20 rounded-full font-semibold hover:bg-purple-500/30"
                      >
                        View Case Study
                      </motion.button>
                      <motion.a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-purple-500/20 rounded-full hover:bg-purple-500/30"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border border-purple-500 rounded-full font-semibold hover:bg-purple-500/10 inline-flex items-center gap-2"
              >
                View All Projects <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Schedule Dialog */}
      {isScheduleDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-[90%] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl border border-purple-500/20"
          >
            {bookingStatus === 'confirmed' ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Booking Confirmed!</h2>
                <p className="text-gray-400 text-lg mb-6">
                  Check your email for the meeting details. We look forward to speaking with you!
                </p>
                <p className="text-sm text-gray-500">This window will close automatically...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Schedule a Discovery Call</h2>
                    <p className="text-gray-400 text-sm md:text-base">
                      Let's discuss your project and explore how we can bring your vision to life.
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setIsScheduleDialogOpen(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-800 rounded-full ml-4"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="aspect-[16/10] w-full bg-gray-800 rounded-lg overflow-hidden">
                      <iframe
                        src="https://cal.com/enock-arthur-dvhd5b/15min"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="camera; microphone; autoplay; fullscreen"
                        title="Schedule Discovery Call"
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">What to Expect</h3>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>15-minute focused discussion</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Project requirements overview</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Technical feasibility assessment</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Timeline and budget discussion</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Next steps and proposal outline</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4">IgnytLabs</h3>
              <p className="text-gray-400">
                Turning ideas into reality, fast.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#portfolio" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Portfolio
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <motion.a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="p-2 bg-purple-500/20 rounded-full hover:bg-purple-500/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </motion.a>
                <motion.a
                  href="https://twitter.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="p-2 bg-purple-500/20 rounded-full hover:bg-purple-500/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </motion.a>
                <motion.a
                  href="https://linkedin.com/in/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="p-2 bg-purple-500/20 rounded-full hover:bg-purple-500/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                  </svg>
                </motion.a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p> {new Date().getFullYear()} IgnytLabs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
