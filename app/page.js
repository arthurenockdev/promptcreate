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

        {/* Projects Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Featured Projects
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project, index) => (
                <motion.a
                  key={project.name}
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="block p-6 rounded-2xl bg-gradient-to-b from-gray-800 to-transparent border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                >
                  <h3 className="text-xl font-bold mb-3">{project.name}</h3>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm rounded-full bg-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Schedule Dialog */}
        {isScheduleDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-[90%] md:max-w-lg border border-purple-500/20"
            >
              {bookingStatus === 'confirmed' ? (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h2 className="text-lg font-bold mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-400 text-sm">
                    Check your email for the meeting details.
                  </p>
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
            <div className="text-center">
              <p className="text-gray-400">
                {new Date().getFullYear()} PromptCreate. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
