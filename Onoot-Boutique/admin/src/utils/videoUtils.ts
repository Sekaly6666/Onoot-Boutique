/**
 * Utilitaires pour la gestion et l'affichage des vidéos et médias (YouTube, Facebook, TikTok, Vimeo, MP4, etc.)
 * Utilisé à la fois pour les Publicités & Vidéos et pour le Catalogue des Produits.
 */

export interface ParsedVideoSource {
  url: string;
  isEmbed: boolean;
  embedUrl: string;
  thumbnail: string;
  platform: 'youtube' | 'facebook' | 'tiktok' | 'vimeo' | 'direct' | 'other';
}

/**
 * Détecte l'API Base URL selon l'environnement.
 * En local (localhost / 127.0.0.1) : chaîne vide (laisse le proxy Vite rediriger).
 * Sur Vercel ou téléphone connecté en distant : 'https://onoot-boutique.onrender.com'
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
  }
  return 'https://onoot-boutique.onrender.com';
}

/**
 * Résout les URLs relatives (ex: /uploads/xxx.mp4 ou /uploads/xxx.jpg)
 * vers l'adresse absolue du serveur Render en production.
 */
export function resolveMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = getApiBaseUrl();
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return base ? `${base}${path}` : path;
}

/**
 * Parse une URL vidéo (YouTube, Facebook Reels/Vidéos, TikTok, Vimeo, Dropbox, MP4 direct)
 * et retourne le lien embed d'affichage ainsi que la miniature éventuelle.
 */
export function parseVideoSource(rawUrl?: string | null): ParsedVideoSource {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { url: '', isEmbed: false, embedUrl: '', thumbnail: '', platform: 'other' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { url: '', isEmbed: false, embedUrl: '', thumbnail: '', platform: 'other' };
  }

  // 1. YouTube detection (watch?v=, youtu.be, shorts, embed)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      url: `https://www.youtube.com/embed/${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`,
      isEmbed: true,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      platform: 'youtube',
    };
  }

  // 2. Facebook Videos & Reels (facebook.com/reel/..., facebook.com/watch/..., fb.watch/..., plugins/video.php)
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    if (trimmed.includes('plugins/video.php')) {
      return {
        url: trimmed,
        embedUrl: trimmed,
        isEmbed: true,
        thumbnail: '',
        platform: 'facebook',
      };
    }
    const cleanFb = trimmed;
    const embedPluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanFb)}&show_text=0`;
    return {
      url: cleanFb,
      embedUrl: embedPluginUrl,
      isEmbed: true,
      thumbnail: '',
      platform: 'facebook',
    };
  }

  // 3. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const vId = vimeoMatch[3];
    return {
      url: `https://player.vimeo.com/video/${vId}`,
      embedUrl: `https://player.vimeo.com/video/${vId}?autoplay=1&muted=1`,
      isEmbed: true,
      thumbnail: '',
      platform: 'vimeo',
    };
  }

  // 4. TikTok
  const tiktokMatch = trimmed.match(/tiktok\.com\/@?[^\/]+\/video\/(\d+)/i);
  if (tiktokMatch && tiktokMatch[1]) {
    const ttId = tiktokMatch[1];
    return {
      url: `https://www.tiktok.com/embed/v2/${ttId}`,
      embedUrl: `https://www.tiktok.com/embed/v2/${ttId}`,
      isEmbed: true,
      thumbnail: '',
      platform: 'tiktok',
    };
  }

  // 5. Dropbox
  if (trimmed.includes('dropbox.com') && trimmed.includes('dl=0')) {
    const directUrl = trimmed.replace('dl=0', 'raw=1');
    return {
      url: directUrl,
      isEmbed: false,
      embedUrl: '',
      thumbnail: '',
      platform: 'direct',
    };
  }

  // 6. Generic embed (already has /embed/ or plugins/video.php)
  if (trimmed.includes('/embed/') || trimmed.includes('plugins/video.php')) {
    return {
      url: trimmed,
      isEmbed: true,
      embedUrl: trimmed,
      thumbnail: '',
      platform: 'other',
    };
  }

  // 7. Direct MP4, WebM, MOV, /uploads/... or other direct video links
  const resolved = resolveMediaUrl(trimmed);
  return {
    url: resolved,
    isEmbed: false,
    embedUrl: '',
    thumbnail: '',
    platform: 'direct',
  };
}

/**
 * Capture automatique d'une image/frame d'une vidéo locale pour miniature
 */
export async function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(file);

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration > 0 ? video.duration / 2 : 0);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(video.src);
              resolve(blob);
            }, 'image/jpeg', 0.85);
            return;
          }
        } catch {
          // ignore canvas extraction error
        }
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Téléverse un fichier (vidéo ou image) sur le serveur.
 * Si l'application est exécutée sur Vercel, on téléverse directement sur Render
 * pour contourner la limite stricte de 4,5 Mo imposée par les rewrites Vercel.
 */
export async function uploadMediaFile(file: File): Promise<{ url: string; absoluteUrl: string }> {
  const token = localStorage.getItem('adminToken');
  const formData = new FormData();
  formData.append('file', file);

  const apiBase = getApiBaseUrl();
  const uploadEndpoint = `${apiBase}/api/admin/upload`;

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(uploadEndpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || `Erreur de téléversement (${res.status})`);
  }

  const data = await res.json();
  const relativeUrl = data.url;
  const absoluteUrl = resolveMediaUrl(relativeUrl);

  return {
    url: absoluteUrl,
    absoluteUrl,
  };
}
