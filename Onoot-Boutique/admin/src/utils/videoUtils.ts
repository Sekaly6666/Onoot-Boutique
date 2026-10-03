/**
 * Utilitaires pour la gestion et l'affichage des vidéos et médias (YouTube, Facebook, TikTok, Vimeo, MP4, etc.)
 * Utilisé à la fois pour les Publicités & Vidéos et pour le Catalogue des Produits.
 */

export interface ParsedVideoSource {
  url: string;
  isEmbed: boolean;
  embedUrl: string;
  thumbnail: string;
  platform: 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'vimeo' | 'direct' | 'other';
  label: string;
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
 * Détecte l'URL du frontend boutique pour les médias statiques (/images/...)
 */
export function getClientBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
  }
  return 'https://onoot-boutique.vercel.app';
}

/**
 * Résout les URLs relatives (ex: /uploads/xxx.mp4 ou /images/xxx.png)
 * vers l'adresse absolue adaptée à l'environnement.
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

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Les images publiques du catalogue (ex: /images/speaker.png) sont hébergées sur le client Vercel
  if (path.startsWith('/images/')) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocal) {
      return path;
    }
    return `https://onoot-boutique.vercel.app${path}`;
  }

  // Fichiers uploadés (/uploads/...) hébergés sur le backend Render
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

/**
 * Normalise les liens Facebook (Reels, Watch, Partages mobiles share/r/ ou share/v/)
 * afin de produire une URL canonique propre et un lien iframe compatible.
 */
export function normalizeFacebookUrl(raw: string): { canonicalUrl: string; embedUrl: string } {
  let url = raw.trim();

  // Si l'URL est déjà une URL plugin avec href=..., extraire la vraie URL cible
  if (url.includes('plugins/video.php')) {
    try {
      const qIndex = url.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(url.slice(qIndex));
        const href = params.get('href');
        if (href) url = decodeURIComponent(href);
      }
    } catch {}
  }

  // Nettoyage des paramètres de tracking mobiles (mibextid, rdid, ref, etc.)
  try {
    const fakeBase = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(fakeBase);
    const trackingKeys = ['mibextid', 'rdid', 'ref', 'sfnsn', 'notif_id', 'notif_t', 'checkpoint_src', 'fbclid', '__tn__'];
    trackingKeys.forEach((k) => parsed.searchParams.delete(k));
    url = parsed.origin + parsed.pathname + (parsed.search ? parsed.search : '');
  } catch {}

  // 1. Détection des partages Facebook Reels : facebook.com/share/r/ID
  const shareReelMatch = url.match(/facebook\.com\/share\/r\/([^/?&#]+)/i);
  if (shareReelMatch && shareReelMatch[1]) {
    const reelId = shareReelMatch[1];
    const canonical = `https://www.facebook.com/reel/${reelId}/`;
    return {
      canonicalUrl: canonical,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`,
    };
  }

  // 2. Détection des partages Facebook Vidéos : facebook.com/share/v/ID
  const shareVideoMatch = url.match(/facebook\.com\/share\/v\/([^/?&#]+)/i);
  if (shareVideoMatch && shareVideoMatch[1]) {
    const vidId = shareVideoMatch[1];
    const canonical = `https://www.facebook.com/watch/?v=${vidId}`;
    return {
      canonicalUrl: canonical,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`,
    };
  }

  // 3. Détection des Reels directs : facebook.com/reel/ID
  const directReelMatch = url.match(/facebook\.com\/reel\/([^/?&#]+)/i);
  if (directReelMatch && directReelMatch[1]) {
    const canonical = `https://www.facebook.com/reel/${directReelMatch[1]}/`;
    return {
      canonicalUrl: canonical,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`,
    };
  }

  // 4. Détection des vidéos directes (watch/?v=ID ou facebook.com/.../videos/ID)
  const canonical = url;
  const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`;
  return {
    canonicalUrl: canonical,
    embedUrl,
  };
}

/**
 * Parse une URL vidéo (YouTube, Facebook Reels/Vidéos, TikTok, Instagram, Vimeo, Dropbox, MP4 direct)
 * et retourne le lien embed d'affichage ainsi que la miniature éventuelle.
 */
export function parseVideoSource(rawUrl?: string | null): ParsedVideoSource {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { url: '', isEmbed: false, embedUrl: '', thumbnail: '', platform: 'other', label: 'Aucune vidéo' };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { url: '', isEmbed: false, embedUrl: '', thumbnail: '', platform: 'other', label: 'Aucune vidéo' };
  }

  // 1. YouTube detection (watch?v=, youtu.be, shorts, embed, m.youtube.com)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return {
      url: canonicalUrl,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`,
      isEmbed: true,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      platform: 'youtube',
      label: 'YouTube',
    };
  }

  // 2. Facebook Videos & Reels (facebook.com/reel/..., facebook.com/share/r/..., facebook.com/watch/..., fb.watch/...)
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    const { canonicalUrl, embedUrl } = normalizeFacebookUrl(trimmed);
    return {
      url: canonicalUrl,
      embedUrl,
      isEmbed: true,
      thumbnail: '',
      platform: 'facebook',
      label: 'Facebook Reel / Vidéo',
    };
  }

  // 3. TikTok
  const tiktokMatch = trimmed.match(/tiktok\.com\/(?:@?[^\/]+\/video\/|v\/|t\/)?(\d+|[a-zA-Z0-9_-]+)/i);
  if (trimmed.includes('tiktok.com')) {
    const ttIdMatch = trimmed.match(/video\/(\d+)/i) || trimmed.match(/tiktok\.com\/t\/([a-zA-Z0-9]+)/i);
    const ttId = ttIdMatch ? ttIdMatch[1] : '';
    return {
      url: trimmed,
      embedUrl: ttId ? `https://www.tiktok.com/embed/v2/${ttId}` : trimmed,
      isEmbed: Boolean(ttId),
      thumbnail: '',
      platform: 'tiktok',
      label: 'TikTok',
    };
  }

  // 4. Instagram Reels & Posts
  if (trimmed.includes('instagram.com/reel/') || trimmed.includes('instagram.com/p/')) {
    const cleanIg = trimmed.split('?')[0];
    const igEmbed = cleanIg.endsWith('/') ? `${cleanIg}embed` : `${cleanIg}/embed`;
    return {
      url: cleanIg,
      embedUrl: igEmbed,
      isEmbed: true,
      thumbnail: '',
      platform: 'instagram',
      label: 'Instagram Reel',
    };
  }

  // 5. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const vId = vimeoMatch[3];
    return {
      url: `https://vimeo.com/${vId}`,
      embedUrl: `https://player.vimeo.com/video/${vId}?autoplay=1&muted=1`,
      isEmbed: true,
      thumbnail: '',
      platform: 'vimeo',
      label: 'Vimeo',
    };
  }

  // 6. Dropbox direct stream
  if (trimmed.includes('dropbox.com') && (trimmed.includes('dl=0') || trimmed.includes('dl=1'))) {
    const directUrl = trimmed.replace(/dl=[01]/, 'raw=1');
    return {
      url: directUrl,
      isEmbed: false,
      embedUrl: '',
      thumbnail: '',
      platform: 'direct',
      label: 'Dropbox Vidéo',
    };
  }

  // 7. Generic embed URL (already contains /embed/)
  if (trimmed.includes('/embed/')) {
    return {
      url: trimmed,
      isEmbed: true,
      embedUrl: trimmed,
      thumbnail: '',
      platform: 'other',
      label: 'Vidéo intégrée',
    };
  }

  // 8. Direct MP4, WebM, MOV, /uploads/... or other direct video links
  const resolved = resolveMediaUrl(trimmed);
  return {
    url: resolved,
    isEmbed: false,
    embedUrl: '',
    thumbnail: '',
    platform: 'direct',
    label: 'Fichier Vidéo (MP4 / WebM)',
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
 * Téléverse un fichier (vidéo ou image) sur le serveur avec gestion de fallback résiliente.
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

  let res: Response;
  try {
    res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (netErr: any) {
    // Si l'URL absolue distante échoue (CORS, offline, etc.), tenter le proxy relatif
    if (apiBase) {
      try {
        res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers,
          body: formData,
        });
      } catch {
        throw new Error("Impossible de joindre le serveur. Vérifiez que votre connexion Internet est active.");
      }
    } else {
      throw new Error(netErr?.message || "Erreur de connexion au serveur d'envoi.");
    }
  }

  if (!res.ok) {
    // Tentative de fallback relative si le serveur Render renvoie une erreur 502/504
    if (apiBase && (res.status >= 500 || res.status === 404)) {
      try {
        const fallbackRes = await fetch('/api/admin/upload', {
          method: 'POST',
          headers,
          body: formData,
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const abs = resolveMediaUrl(fbData.url);
          return { url: abs, absoluteUrl: abs };
        }
      } catch {}
    }
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
