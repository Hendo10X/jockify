'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Music, Play, Loader2, LogOut } from 'lucide-react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Playlist {
  id: string;
  name: string;
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

  useEffect(() => {
    if (session?.accessToken) {
      loadPlaylists();
    }
  }, [session]);

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
          name: item.name
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
    // Split the content into sections
    const sections = content.split('\n\n');
    
    return sections.map((section, index) => {
      // Check if it's a bullet point list
      if (section.startsWith('- ')) {
        const items = section.split('\n').map(item => item.replace('- ', ''));
        return (
          <ul key={index} className="list-disc pl-4 space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        );
      }
      
      // Check if it's a numbered list
      if (section.match(/^\d+\./)) {
        const items = section.split('\n').map(item => item.replace(/^\d+\.\s*/, ''));
        return (
          <ol key={index} className="list-decimal pl-4 space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ol>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-sm mb-2">
          {section}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <div className="max-w-[640px] w-full mx-auto px-6 pt-6 mt-10">
        <div className="flex items-center justify-between">
          {/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-full overflow-hidden">
              <Image
                src={session?.user?.image || '/default-avatar.png'}
                alt="User Profile"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm leading-none text-black">{session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="text-xs text-[#FF3B30] hover:text-[#FF3B30]/90 transition-colors text-left"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Logo */}
          <div className="w-8 h-8 relative">
            <Image
              src="/Jockeysvg.svg"
              alt="AI DJ Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Messages */}
      <div className="flex-1 max-w-[640px] mx-auto w-full px-6 pt-6 pb-32">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-[20px] px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-[#F2F2F7] text-black'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-[15px] leading-5 text-black">
                    {formatMessage(message.content)}
                  </div>
                ) : (
                  <p className="text-[15px] leading-5">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F2F2F7] rounded-[20px] px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#8E8E93]" />
                <span className="text-[15px] leading-5 text-black">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white  border-[#F2F2F7] py-4">
        <div className="max-w-[640px] mx-auto px-6 space-y-2">
          {/* Playlist Selector */}
          <select
            value={selectedPlaylist}
            onChange={(e) => setSelectedPlaylist(e.target.value)}
            className="w-full px-4 py-[14px] text-[15px] text-black bg-white rounded-lg font-inter outline-none appearance-none cursor-pointer border border-[#F2F2F7]"
            disabled={isLoadingPlaylists}
          >
            <option value="" className="font-inter">Choose a playlist to remix with AI</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id} className="font-inter">
                {playlist.name}
              </option>
            ))}
          </select>

          {/* Input Form */}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI to remix your playlist in any style you want"
              className="w-full px-4 py-4 text-[16px] bg-[#F2F2F7] rounded-lg outline-none placeholder:text-[#8E8E93] text-black"
              disabled={!selectedPlaylist || isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedPlaylist || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 