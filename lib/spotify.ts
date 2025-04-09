import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getSpotifyToken() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error('No Spotify token available');
  }
  return session.accessToken;
}

export async function fetchSpotifyData(endpoint: string) {
  const token = await getSpotifyToken();
  
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Spotify API Error:', error);
    throw new Error(`Failed to fetch Spotify data: ${error.error?.message || 'Unknown error'}`);
  }

  return response.json();
}

export async function getCurrentUserPlaylists() {
  try {
    const data = await fetchSpotifyData('/me/playlists?limit=50');
    return data;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
}

export async function getPlaylistTracks(playlistId: string) {
  try {
    const data = await fetchSpotifyData(`/playlists/${playlistId}/tracks`);
    return data;
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    throw error;
  }
}

export async function getTrackFeatures(trackId: string) {
  try {
    const data = await fetchSpotifyData(`/audio-features/${trackId}`);
    return data;
  } catch (error) {
    console.error('Error fetching track features:', error);
    throw error;
  }
} 