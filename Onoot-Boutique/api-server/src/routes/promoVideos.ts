import { Router, type IRouter } from "express";
import { PromoVideo } from "../models/PromoVideo";
import { requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Seed initial demo promo videos if database is empty
async function seedDemoPromoVideosIfEmpty() {
  try {
    const count = await PromoVideo.countDocuments();
    if (count === 0) {
      const demoVideos = [
        {
          title: "Smartwatch Ultra Pro Séries",
          subtitle: "Écran AMOLED HD & Autonomie 7 jours",
          description: "La montre intelligente ultime pour vos activités sportives et professionnelles avec capteur cardiaque précis.",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-smartwatch-touchscreen-40742-large.mp4",
          thumbnailUrl: "/images/smartwatch.png",
          productLink: "/products",
          productName: "Smartwatch Pro S8",
          price: 45000,
          discountPrice: 38000,
          badge: "FLASH SALE -15%",
          placement: "all",
          isActive: true,
          order: 1,
          viewsCount: 1420,
        },
        {
          title: "Écouteurs Sans Fil Bass Boost",
          subtitle: "Réduction active de bruit & Son immersif",
          description: "Plongez dans votre musique sans interruption avec la technologie ANC de pointe et basses profondes.",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-wearing-wireless-earphones-and-dancing-40733-large.mp4",
          thumbnailUrl: "/images/earbuds.png",
          productLink: "/products",
          productName: "Écouteurs Bluetooth",
          price: 18000,
          discountPrice: 15000,
          badge: "NOUVELLE SORTIE",
          placement: "all",
          isActive: true,
          order: 2,
          viewsCount: 980,
        },
        {
          title: "Batterie Solaire & Rapide 20000mAh",
          subtitle: "Ne soyez plus jamais à court d'énergie",
          description: "Charge ultra rapide 65W compatible iPhone, Samsung et tous smartphones Android.",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-modern-smartphone-with-a-black-screen-40737-large.mp4",
          thumbnailUrl: "/images/powerbank.png",
          productLink: "/products",
          productName: "PowerBank 20000mAh",
          price: 25000,
          discountPrice: 22000,
          badge: "COUP DE CŒUR",
          placement: "all",
          isActive: true,
          order: 3,
          viewsCount: 2350,
        }
      ];

      await PromoVideo.insertMany(demoVideos);
      logger.info('Auto-seeded 3 demo promotional videos for Onoot Boutique');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to seed demo promo videos');
  }
}

// Ensure seed runs on startup
seedDemoPromoVideosIfEmpty();

/* ─── PUBLIC ROUTES (FOR BOUTIQUE) ─── */

// GET active promo videos for the storefront
router.get("/promo-videos", async (req, res): Promise<void> => {
  try {
    const { placement } = req.query;
    const filter: any = { isActive: true };
    if (placement && placement !== 'all') {
      filter.$or = [{ placement: placement }, { placement: 'all' }];
    }
    const videos = await PromoVideo.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    res.json(videos);
  } catch (err) {
    logger.error({ err }, "Failed to fetch promo videos for store");
    res.status(500).json({ error: "Erreur serveur lors de la récupération des vidéos publicitaires" });
  }
});

// Increment views counter
router.post("/promo-videos/:id/view", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    await PromoVideo.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Impossible d'incrémenter le compteur de vues" });
  }
});

/* ─── ADMIN ROUTES ─── */

// GET all promo videos with summary stats
router.get("/admin/promo-videos", requireAdmin, async (req, res): Promise<void> => {
  try {
    const videos = await PromoVideo.find().sort({ order: 1, createdAt: -1 }).lean();
    const total = videos.length;
    const active = videos.filter((v) => v.isActive).length;
    const totalViews = videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0);
    const marqueeCount = videos.filter((v) => v.isActive && (v.placement === 'marquee' || v.placement === 'all')).length;

    res.json({
      videos,
      stats: {
        total,
        active,
        totalViews,
        marqueeCount,
      },
    });
  } catch (err) {
    logger.error({ err }, "Admin failed to fetch promo videos");
    res.status(500).json({ error: "Erreur lors de la récupération des publicités" });
  }
});

// CREATE promo video
router.post("/admin/promo-videos", requireAdmin, async (req, res): Promise<void> => {
  try {
    const {
      title,
      subtitle,
      description,
      videoUrl,
      thumbnailUrl,
      productLink,
      productName,
      productId,
      price,
      discountPrice,
      badge,
      placement,
      isActive,
      order,
    } = req.body;

    if (!title || !videoUrl) {
      res.status(400).json({ error: "Le titre et le lien de la vidéo sont obligatoires." });
      return;
    }

    const newVideo = new PromoVideo({
      title,
      subtitle,
      description,
      videoUrl,
      thumbnailUrl,
      productLink: productLink || '/products',
      productName,
      productId,
      price: price ? Number(price) : undefined,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      badge: badge ? badge.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B50}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu, "").trim() : 'PROMO EXCLUSIVE',
      placement: placement || 'all',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: order ? Number(order) : 0,
      viewsCount: 0,
    });

    await newVideo.save();
    logger.info({ id: newVideo._id, title: newVideo.title }, "New promo video created");
    res.status(201).json(newVideo);
  } catch (err: any) {
    logger.error({ err }, "Failed to create promo video");
    res.status(400).json({ error: err.message || "Erreur lors de l'enregistrement de la vidéo publicitaire" });
  }
});

// UPDATE promo video
router.put("/admin/promo-videos/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.discountPrice !== undefined) updateData.discountPrice = Number(updateData.discountPrice);
    if (updateData.order !== undefined) updateData.order = Number(updateData.order);

    const updated = await PromoVideo.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      res.status(404).json({ error: "Vidéo publicitaire introuvable" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    logger.error({ err }, "Failed to update promo video");
    res.status(400).json({ error: err.message || "Erreur lors de la mise à jour" });
  }
});

// TOGGLE active state
router.patch("/admin/promo-videos/:id/toggle", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await PromoVideo.findById(id);
    if (!video) {
      res.status(404).json({ error: "Vidéo publicitaire introuvable" });
      return;
    }
    video.isActive = !video.isActive;
    await video.save();
    res.json({ success: true, isActive: video.isActive });
  } catch (err: any) {
    res.status(400).json({ error: "Erreur lors du changement de statut" });
  }
});

// DELETE promo video
router.delete("/admin/promo-videos/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await PromoVideo.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Vidéo publicitaire introuvable" });
      return;
    }
    res.json({ success: true, message: "Vidéo supprimée avec succès" });
  } catch (err) {
    logger.error({ err }, "Failed to delete promo video");
    res.status(400).json({ error: "Erreur lors de la suppression de la vidéo" });
  }
});

export default router;
