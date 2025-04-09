'use client';

import { useSession } from 'next-auth/react';
import DJInterface from './components/DJInterface';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black">
        <div className="w-full max-w-md mx-auto flex flex-col items-center p-4 space-y-8">
          <div className="w-24 h-24 relative mb-4">
            <Image
              src="/Jockeysvg.svg"
              alt="AI DJ Logo"
              fill
              className="object-contain"
                            
            />
          </div>
          
          <h1 className="text-4xl font-instrument text-center">
            Ask the AI to remix your
            <br />
            playlist in any style you want
          </h1>
          
          <a
            href="/api/auth/signin"
            className="mt-8 px-8 py-3 rounded-full bg-green-400 text-green-900 font-medium hover:bg-green-300 transition-colors duration-200 text-sm"
          >
            Login with spotify
          </a>
        </div>
      </div>
    );
  }

  return <DJInterface />;
}
