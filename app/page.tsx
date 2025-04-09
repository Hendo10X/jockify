'use client';

import { useSession, signOut } from 'next-auth/react';
import DJInterface from './components/DJInterface';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Music, LogIn, LogOut } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Music className="h-6 w-6" />
              AI DJ
            </CardTitle>
            <CardDescription>
              Connect your Spotify account to start remixing your playlists with AI!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full"
              variant="outline"
            >
              <a href="/api/auth/signin">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in with Spotify
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="bg-background/50 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            <h1 className="text-xl font-semibold">AI DJ</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Signed in as {session.user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        <DJInterface />
      </main>
    </div>
  );
}
