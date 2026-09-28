import { Router, type IRouter } from "express";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import crypto from "crypto";
import https from "https";
import { sendLoginNotification } from "../lib/email";

const router: IRouter = Router();

function getGoogleConfig(req?: any) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  // Canonical backend URL for Google OAuth callback
  let apiBase = process.env.API_BASE_URL;
  if (!apiBase || apiBase.includes("localhost")) {
    if (process.env.NODE_ENV === "production" || process.env.RENDER) {
      apiBase = "https://onoot-boutique.onrender.com";
    } else if (req) {
      const proto = req.get("x-forwarded-proto") || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host") || `localhost:${process.env.PORT || 5005}`;
      apiBase = `${proto}://${host}`;
    } else {
      apiBase = `http://localhost:${process.env.PORT || 5005}`;
    }
  }

  const redirectUri = `${apiBase.replace(/\/$/, "")}/api/auth/google/callback`;
  const boutiqueUrl =
    process.env.BOUTIQUE_URL ||
    (process.env.NODE_ENV === "production" || process.env.RENDER
      ? "https://onoot-boutique.vercel.app"
      : "http://localhost:5182");

  return { clientId, clientSecret, apiBase, boutiqueUrl, redirectUri };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function formatUser(user: any, orderCount = 0) {
  const lastActiveDate = user.lastActive || user.lastLogin;
  const isOnline = lastActiveDate
    ? Date.now() - new Date(lastActiveDate).getTime() < 15 * 60 * 1000
    : false;

  return {
    id: user._id,
    _id: user._id,
    email: user.email,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    address: null,
    city: null,
    country: null,
    status: user.status ?? "actif",
    authProvider: user.authProvider ?? "local",
    googleId: user.googleId ?? null,
    joinDate: user.joinDate?.toISOString() || user.createdAt?.toISOString(),
    createdAt: user.createdAt?.toISOString() || user.joinDate?.toISOString(),
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    lastActive: user.lastActive ? user.lastActive.toISOString() : null,
    isOnline,
    orderCount,
  };
}

function generateToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const sig = crypto
    .createHash("sha256")
    .update(payload + "onoot_jwt_secret")
    .digest("hex");
  return Buffer.from(payload).toString("base64") + "." + sig;
}

export function verifyToken(token: string): string | null {
  try {
    const [payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString());
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

/** Simple GET helper over HTTPS */
function httpsGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    }).on("error", reject);
  });
}

/** POST helper over HTTPS */
function httpsPost(url: string, body: string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  console.log("[REGISTER] body reçu:", JSON.stringify(req.body));
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    console.log("[REGISTER] validation échouée:", parsed.error.message);
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, name, phone } = parsed.data;
  console.log("[REGISTER] données valides, email:", email);

  const existing = await User.findOne({ email }).exec();
  if (existing) {
    res.status(400).json({ error: "Un compte existe peut‑être déjà avec cet email." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [firstName = "", lastName = ""] = (name ?? "").split(" ");
  const now = new Date();
  const newUser = new User({
    email,
    firstName,
    lastName,
    phone,
    passwordHash,
    role: "client",
    authProvider: "local",
    joinDate: now,
    lastLogin: now,
    lastActive: now,
  });
  await newUser.save();

  const token = generateToken(newUser._id.toString());

  // Send registration welcome notification email asynchronously
  sendLoginNotification(newUser.email, newUser.firstName || `${newUser.firstName ?? ''} ${newUser.lastName ?? ''}`.trim(), {
    provider: 'local',
    date: now,
  }).catch((err) => console.error("Email register notification error:", err));

  res.status(201).json({ user: formatUser(newUser, 0), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).exec();
  if (!user) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }

  // Google-only accounts don't have a password
  if ((user as any).authProvider === "google" && !(user as any).passwordHash) {
    res.status(401).json({ error: "Ce compte utilise la connexion Google. Utilisez le bouton Google." });
    return;
  }

  const isMatch = await bcrypt.compare(password as string, (user as any).passwordHash as string);
  if (!isMatch) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }

  const now = new Date();
  user.lastLogin = now;
  user.lastActive = now;
  await user.save();

  const token = generateToken(user._id.toString());
  
  // Send login notification email asynchronously
  sendLoginNotification(user.email, user.firstName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(), {
    provider: 'local',
    date: now,
  }).catch((err) => console.error("Email login notification error:", err));

  res.json({ user: formatUser(user, 0), token });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const userId = verifyToken(authHeader.slice(7));
    if (userId) {
      await User.findByIdAndUpdate(userId, { lastActive: new Date(0) }).exec();
    }
  }
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const user = await User.findById(userId).exec();
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  user.lastActive = new Date();
  await user.save();

  res.json(formatUser(user, 0));
});

// ─── Google OAuth2 ────────────────────────────────────────────────────────────

/** Step 1: Redirect to Google */
router.get("/auth/google", (req, res): void => {
  const { clientId, boutiqueUrl, redirectUri } = getGoogleConfig(req);

  if (!clientId) {
    res.status(503).json({
      error: "Google OAuth non configuré. Ajoutez GOOGLE_CLIENT_ID dans le .env",
    });
    return;
  }

  // Preserve originating frontend URL and source page if supplied
  const origin = (req.query.origin as string) || (req.query.returnUrl as string) || req.get("referer") || boutiqueUrl;
  const from = (req.query.from as string) || (origin.includes("register") ? "register" : "login");
  const stateData = JSON.stringify({ origin, from, redirectUri });
  const state = Buffer.from(stateData).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/** Step 2: Google callback */
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const { code, state, error: oauthError, error_description } = req.query as Record<string, string>;
  const config = getGoogleConfig(req);

  let returnOrigin = config.boutiqueUrl;
  let fromPage = "login";
  let step1RedirectUri = config.redirectUri;

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      if (decoded?.origin && typeof decoded.origin === "string") {
        returnOrigin = decoded.origin.replace(/\/$/, "");
      }
      if (decoded?.from === "register") {
        fromPage = "register";
      }
      if (decoded?.redirectUri) {
        step1RedirectUri = decoded.redirectUri;
      }
    } catch (e) {
      console.warn("[GOOGLE AUTH] Failed to parse state:", e);
    }
  }

  const targetPath = fromPage === "register" ? "/auth/register" : "/auth/login";

  if (oauthError || !code) {
    console.warn("[GOOGLE AUTH] OAuth rejected by user or Google:", oauthError, error_description);
    res.redirect(`${returnOrigin}${targetPath}?error=google_cancelled`);
    return;
  }

  try {
    // Exchange code for tokens using EXACT redirect_uri from step 1
    const tokenBody = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: step1RedirectUri,
      grant_type: "authorization_code",
    }).toString();

    console.log("[GOOGLE AUTH] Exchanging code with redirect_uri:", step1RedirectUri);

    const tokenResponse = await httpsPost(
      "https://oauth2.googleapis.com/token",
      tokenBody,
      { "Content-Type": "application/x-www-form-urlencoded" }
    );

    if (!tokenResponse.access_token) {
      console.error("[GOOGLE AUTH] Token exchange error response from Google:", JSON.stringify(tokenResponse));
      const reason = tokenResponse.error_description || tokenResponse.error || "no_access_token";
      res.redirect(`${returnOrigin}${targetPath}?error=google_failed&reason=${encodeURIComponent(reason)}`);
      return;
    }

    // Get user info from Google
    const googleUser = await httpsGet(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
    );

    const { id: googleId, email, name, picture, given_name, family_name } = googleUser;

    if (!email) {
      console.error("[GOOGLE AUTH] Userinfo missing email:", JSON.stringify(googleUser));
      res.redirect(`${returnOrigin}${targetPath}?error=google_failed&reason=${encodeURIComponent("email_manquant")}`);
      return;
    }

    const now = new Date();

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    }).exec();

    if (user) {
      // Update Google fields if logging in via Google for first time
      (user as any).googleId = googleId;
      (user as any).authProvider = "google";
      if (picture && !(user as any).avatar) (user as any).avatar = picture;
      user.lastLogin = now;
      user.lastActive = now;
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        firstName: given_name || name?.split(" ")[0] || email.split("@")[0],
        lastName: family_name || name?.split(" ").slice(1).join(" ") || "",
        googleId,
        authProvider: "google",
        avatar: picture || undefined,
        role: "client",
        status: "actif",
        joinDate: now,
        lastLogin: now,
        lastActive: now,
      });
      await user.save();
    }

    const token = generateToken(user._id.toString());

    // Send login notification email asynchronously
    sendLoginNotification(user.email, user.firstName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(), {
      provider: 'google',
      date: now,
    }).catch((err) => console.error("Email login notification error:", err));

    // Redirect to boutique with token
    res.redirect(`${returnOrigin}/auth/callback?token=${token}`);
  } catch (err: any) {
    console.error("[GOOGLE AUTH] Exception:", err.message);
    res.redirect(`${returnOrigin}${targetPath}?error=google_failed&reason=${encodeURIComponent(err.message || "erreur_serveur")}`);
  }
});

export default router;
