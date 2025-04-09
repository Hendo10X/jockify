'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Music, Play, Loader2, LogOut, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface SpotifySession {
  accessToken: string;
  user?: {
    name?: string;
    image?: string;
  };
}

export default function DJInterface() {
  const { data: session } = useSession() as { data: SpotifySession | null };
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylists();
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPlaylists = async () => {
    try {
      setIsLoadingPlaylists(true);
      setError(null);
      
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const data = await response.json();
      
      if (data && data.items) {
        setPlaylists(data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          images: item.images || []
        })));
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPlaylist) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${selectedPlaylist}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!tracksResponse.ok) {
        const errorData = await tracksResponse.json();
        throw new Error(`Failed to fetch playlist tracks: ${errorData.error?.message || 'Unknown error'}`);
      }

      const playlistData = await tracksResponse.json();
      const tracks = playlistData.items.map((item: any) => ({
        name: item.track.name,
        artist: item.track.artists[0]?.name,
        album: item.track.album?.name
      }));

      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `You are an AI DJ. The user wants to ${input}. Here are the tracks in their playlist: ${JSON.stringify(tracks, null, 2)}. 
      Please provide specific suggestions on how to remix or modify these tracks to achieve their desired effect. 
      Include specific techniques, effects, or transitions that would work well with these tracks.`;

      const result = await model.generateContent(prompt);
      if (!result.response) {
        throw new Error('No response from Gemini API');
      }

      const text = result.response.text();
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const assistantMessage: Message = { role: 'assistant', content: text };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Failed to process your request: ${errorMessage}`);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or rephrase your request.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    // Remove duplicate numbers at the start of lines
    content = content.replace(/^\d+\.\s*\d+\./gm, (match) => match.split('.')[0] + '.');
    
    // Convert **text** to proper formatting
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Split into paragraphs and format
    const paragraphs = content.split('\n\n').map(para => para.trim());
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          // Check if it's a heading (starts with "General" or similar keywords)
          if (paragraph.toLowerCase().includes('general') || 
              paragraph.toLowerCase().includes('approach') ||
              paragraph.toLowerCase().includes('blueprint')) {
            return (
              <h3 key={index} className="font-medium text-[15px] text-black mb-2">
                {paragraph.replace(/\*\*/g, '')}
              </h3>
            );
          }
          
          // Check if it's a numbered point
          if (/^\d+\./.test(paragraph)) {
            return (
              <div key={index} className="pl-4">
                <p 
                  className="text-[15px] leading-relaxed text-gray-800"
                  dangerouslySetInnerHTML={{ 
                    __html: paragraph.replace(/^\d+\.\s*/, '') 
                  }}
                />
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p 
              key={index} 
              className="text-[15px] leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          );
        })}
      </div>
    );
  };

  const selectedPlaylistName = playlists.find(p => p.id === selectedPlaylist)?.name;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-white relative flex flex-col"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-[640px] w-full mx-auto px-6 pt-6 mt-10"
      >
        <div className="flex items-center justify-between">
          {/* User Profile */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 relative rounded-full overflow-hidden">
              <Image
                src={session?.user?.image || '/default-avatar.png'}
                alt="User Profile"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm leading-none text-black px-1 py-0.5">{session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-[12px] text-[#FF3B30] hover:text-[#FF3B30]/90 px-1 py-0.5 rounded-sm hover:bg-pink-50 transition-colors text-left"
              >
                Sign out
              </button>
            </div>
          </motion.div>

          {/* Logo */}
          <div className="w-8 h-8 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.3,
                duration: 0.5,
                ease: "easeOut"
              }}
              className="w-full h-full"
            >
              <Image
                src="/Jockify.svg"
                alt="AI DJ Logo"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Messages */}
      <div className="flex-1 max-w-[640px] mx-auto w-full px-6 pt-6 pb-32">
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center"
              >
                <div className="p-6 max-w-[400px]">
                  <p className="text-[14px] text-gray-400 leading-relaxed">
                    Select a playlist below and ask me to remix it in any style you want.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-2 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-full bg-[#F2F2F7] text-[13px] text-gray-600 hover:bg-[#E5E5EA] transition-colors"
                      onClick={() => setInput("Turn this playlist into a lofi hip hop mix")}
                    >
                      "Turn this into lofi hip hop"
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-full bg-[#F2F2F7] text-[13px] text-gray-600 hover:bg-[#E5E5EA] transition-colors"
                      onClick={() => setInput("Create a high energy dance remix of these songs")}
                    >
                      "Make a dance remix"
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-full bg-[#F2F2F7] text-[13px] text-gray-600 hover:bg-[#E5E5EA] transition-colors"
                      onClick={() => setInput("Mix these songs in a chill ambient style")}
                    >
                      "Create a chill ambient mix"
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-full bg-[#F2F2F7] text-[13px] text-gray-600 hover:bg-[#E5E5EA] transition-colors"
                      onClick={() => setInput("Blend these tracks into a smooth jazz style")}
                    >
                      "Turn into smooth jazz"
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className={`max-w-[85%] rounded-[20px] px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-[#F8F8FA] text-black shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-[15px] leading-relaxed">
                      {formatMessage(message.content)}
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed">
                      {message.content}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="bg-[#F2F2F7] rounded-[20px] px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#8E8E93]" />
                  <span className="text-[15px] leading-5 text-black">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* Bottom Bar - Fixed at bottom */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
        className="fixed bottom-0 left-0 right-0 bg-white  py-4"
      >
        <div className="max-w-[640px] mx-auto px-6 space-y-2">
          {/* Custom Playlist Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-[14px] text-[15px] text-black bg-white rounded-lg font-inter outline-none cursor-pointer border border-[#F2F2F7] flex items-center justify-between"
              disabled={isLoadingPlaylists}
            >
              <span className="truncate font-inter text-[14px] text-emerald-500">
                {selectedPlaylistName || "Choose a playlist to remix with AI"}
              </span>
              <ChevronDown className={`h-4 w-4 text-black transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-2 left-0 w-full bg-white rounded-lg border border-[#F2F2F7] shadow-lg max-h-[400px] overflow-y-auto z-50"
              >
                <div className="grid grid-cols-2 gap-2 p-2">
                  {isLoadingPlaylists ? (
                    <div className="col-span-2 flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading playlists...</span>
                    </div>
                  ) : playlists.length === 0 ? (
                    <div className="col-span-2 text-center py-4 text-sm text-gray-500">
                      No playlists found
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <motion.button
                        key={playlist.id}
                        onClick={() => {
                          setSelectedPlaylist(playlist.id);
                          setIsDropdownOpen(false);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          selectedPlaylist === playlist.id 
                            ? 'bg-[#F8F8FA] border border-[#E5E5EA]' 
                            : 'hover:bg-[#F8F8FA] border border-transparent'
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#F8F8FA]">
                          {playlist.images[0]?.url ? (
                            <Image
                              src={playlist.images[0].url}
                              alt={playlist.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-start text-left min-w-0">
                          <span className="text-sm font-medium text-black truncate w-full">
                            {playlist.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            Playlist
                          </span>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Form */}
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI to remix your playlist in any style you want"
              className="w-full px-4 py-4 text-[16px] bg-[#F2F2F7] rounded-lg outline-none placeholder:text-[#8E8E93] text-black resize-none h-[100px]"
              disabled={!selectedPlaylist || isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={isLoading || !selectedPlaylist || !input.trim()}
              className="absolute right-3 bottom-3 bg-black text-white px-4 py-2 rounded-full disabled:opacity-50 text-sm font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send"
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 