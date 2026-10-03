/**
 * Utilitaires partagés pour l'affichage et la gestion des vidéos sur la boutique Onoot.
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

  if (path.startsWith('/images/')) {
    return path;
  }

  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

export function normalizeFacebookUrl(raw: string): { canonicalUrl: string; embedUrl: string } {
  let url = raw.trim();

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

  try {
    const fakeBase = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(fakeBase);
    const trackingKeys = ['mibextid', 'rdid', 'ref', 'sfnsn', 'notif_id', 'notif_t', 'checkpoint_src', 'fbclid', '__tn__'];
    trackingKeys.forEach((k) => parsed.searchParams.delete(k));
    url = parsed.origin + parsed.pathname + (parsed.search ? parsed.search : '');
  } catch {}

  const shareReelMatch = url.match(/facebook\.com\/share\/r\/([^/?&#]+)/i);
  if (shareReelMatch && shareReelMatch[1]) {
    const reelId = shareReelMatch[1];
    const canonical = `https://www.facebook.com/reel/${reelId}/`;
    return {
      canonicalUrl: canonical,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`,
    };
  }

  const shareVideoMatch = url.match(/facebook\.com\/share\/v\/([^/?&#]+)/i);
  if (shareVideoMatch && shareVideoMatch[1]) {
    const vidId = shareVideoMatch[1];
    const canonical = `https://www.facebook.com/watch/?v=${vidId}`;
    return {
      canonicalUrl: canonical,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`,
    };
  }

  const directReelMatch = url.match(/facebook\.com\/reel\/([^/?&#]+)/i);
  if (directReelMatch && directReelMatch[1]) {
    const canonical = `https://www.facebook.com/reel/${directReelMatch[1]}/`;
    return {
      canonicalUrl: canonical,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`,
    };
  }

  const canonical = url;
  const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=0`;
  return { canonicalUrl: canonical, embedUrl };
}

export function isEmbedVideo(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('facebook.com') ||
    url.includes('fb.watch') ||
    url.includes('plugins/video.php') ||
    url.includes('tiktok.com') ||
    url.includes('/embed/')
  );
}

export function isVerticalVideo(url?: string): boolean {
  if (!url) return true;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {}
  return (
    decoded.includes('/reel/') ||
    decoded.includes('/share/r/') ||
    decoded.includes('/shorts/') ||
    decoded.includes('tiktok.com') ||
    decoded.includes('instagram.com') ||
    !decoded.includes('youtube.com/watch')
  );
}

export function getEmbedAutoplayUrl(rawUrl?: string, muted: boolean = true): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // 1. YouTube (regulier, shorts, youtu.be)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? '1' : '0'}&playsinline=1&rel=0&modestbranding=1`;
  }

  // 2. Facebook (Reels & Vidéos)
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    const { canonicalUrl } = normalizeFacebookUrl(trimmed);
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}&show_text=0&autoplay=1&mute=${muted ? '1' : '0'}`;
  }

  // 3. TikTok
  const ttIdMatch = trimmed.match(/video\/(\d+)/i) || trimmed.match(/tiktok\.com\/t\/([a-zA-Z0-9]+)/i);
  if (trimmed.includes('tiktok.com') && ttIdMatch && ttIdMatch[1]) {
    return `https://www.tiktok.com/embed/v2/${ttIdMatch[1]}`;
  }

  // 4. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&muted=${muted ? '1' : '0'}`;
  }

  // 5. Generic embed
  if (trimmed.includes('/embed/')) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('mute', muted ? '1' : '0');
      return u.toString();
    } catch {
      const sep = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${sep}autoplay=1&mute=${muted ? '1' : '0'}`;
    }
  }

  return trimmed;
}
