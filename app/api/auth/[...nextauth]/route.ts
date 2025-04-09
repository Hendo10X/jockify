import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

const scope = 'user-read-email user-read-private playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state';

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { 
          scope,
          redirect_uri: 'http://localhost:3000/api/auth/callback/spotify'
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 