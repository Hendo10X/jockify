# Jockify - AI-Powered Music Remix Assistant

Jockify is a modern web application that allows users to transform their Spotify playlists using AI. With a sleek, intuitive interface, users can select their playlists and request AI-powered remixes in various styles, from lofi hip hop to dance remixes.


## Features

- 🔐 **Spotify Integration**: Seamless authentication and playlist access
- 🎵 **Smart Playlist Selection**: Browse and select from your Spotify playlists
- 🤖 **AI-Powered Remixing**: Transform your playlists into different styles
- 💬 **Interactive Chat Interface**: Natural conversation with the AI DJ
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- 📱 **Mobile-Friendly**: Optimized for all device sizes

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Framer Motion
- **Authentication**: NextAuth.js
- **AI Integration**: Google's Gemini API
- **Styling**: Tailwind CSS, CSS Modules
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account
- Google Gemini API Key

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jockify.git
cd jockify
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. **Sign In**: Click the "Sign in with Spotify" button to authenticate
2. **Select Playlist**: Choose a playlist from your Spotify library
3. **Request Remix**: Use the chat interface to request specific remix styles
4. **Get Suggestions**: Use the suggestion bubbles for quick remix ideas
5. **Enjoy**: Receive AI-powered remix suggestions for your playlist

## Project Structure

```
jockify/
├── app/
│   ├── api/
│   │   └── auth/
│   ├── components/
│   │   ├── ui/
│   │   └── DJInterface.tsx
│   └── page.tsx
├── public/
│   └── Jockeysvg.svg
├── styles/
│   └── globals.css
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Google Gemini](https://ai.google.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Made with ❤️ by Hendo
