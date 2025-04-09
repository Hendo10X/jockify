'use client';

import { useSession, signIn } from 'next-auth/react';
import DJInterface from './components/DJInterface';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md mx-auto flex flex-col items-center p-4 space-y-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 relative mb-4"
          >
            <Image
              src="/Jockeysvg.svg"
              alt="AI DJ Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
            
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-instrument text-center"
          >
            Ask the AI to remix your
            <br />
            playlist in any style you want
          </motion.h1>
           
          <motion.a
            href="/api/auth/signin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-8 px-8 py-3 rounded-full bg-green-400 text-green-900 font-medium hover:bg-green-300 transition-colors duration-200 text-sm"
          >
            Login with spotify
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return <DJInterface />;
}
