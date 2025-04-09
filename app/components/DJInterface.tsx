'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Music, Play, Loader2 } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-instrument flex items-center gap-2">
            <Music className="h-5 w-5" />
            Select a Playlist
          </CardTitle>
          <CardDescription className="text-sm font-jetbrains text-muted-foreground">
            Choose a playlist to remix with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <select
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background/50 backdrop-blur-sm outline-none font-jetbrains text-sm"
              disabled={isLoadingPlaylists}
            >
              <option value="">Select a playlist</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
            {isLoadingPlaylists && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive mt-2 font-jetbrains">{error}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-instrument">AI DJ Chat</CardTitle>
          <CardDescription className="text-sm font-jetbrains text-muted-foreground">
            Ask the AI to remix your playlist in any style you want
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[400px] overflow-y-auto space-y-4 pr-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground font-jetbrains'
                      : 'bg-muted font-instrument'
                  }`}
                >
                  {message.role === 'user' ? (
                    message.content
                  ) : (
                    <div className="space-y-2">
                      {formatMessage(message.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2 text-sm font-jetbrains">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI DJ to remix your playlist..."
              className="flex-1 p-2 border rounded-lg bg-background/50 backdrop-blur-sm outline-none text-sm font-jetbrains"
              disabled={!selectedPlaylist || isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !selectedPlaylist || !input.trim()}
              className="flex items-center gap-2 text-sm font-jetbrains"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
} 