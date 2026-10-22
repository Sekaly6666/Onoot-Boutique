import { Router, type IRouter } from "express";
import { PromoVideo } from "../models/PromoVideo";
import { requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

import mongoose from "mongoose";
import { Product } from "../models/Product";
import { Category } from "../models/Category";

async function resolveCanonicalCategory(rawCat?: string): Promise<string> {
  if (!rawCat || !rawCat.trim()) return 'accessoires';
  const clean = rawCat.trim();
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matched = await Category.findOne({
    $or: [
      { slug: new RegExp(`^${escaped}$`, 'i') },
      { name: new RegExp(`^${escaped}$`, 'i') }
    ]
  }).catch(() => null);

  if (matched && matched.slug) return matched.slug;
  if (/^(watches|smartwatches|montres)/i.test(clean)) return 'watches';
  if (/^(earphones|ecouteurs|audio)/i.test(clean)) return 'earphones';
  return clean;
}

// Seed initial demo promo videos and ensure all promo videos have matching real products in DB
async function syncPromoVideosWithProducts() {
  try {
    const allVideos = await PromoVideo.find({});
    for (const v of allVideos) {
      let matchedProduct = null;
      if (v.productId && mongoose.isValidObjectId(v.productId)) {
        matchedProduct = await Product.findById(v.productId);
      }
      
      const prodName = (v.productName && v.productName.trim() !== '') ? v.productName.trim() : v.title.trim();

      if (!matchedProduct) {
        matchedProduct = await Product.findOne({ name: new RegExp(`^${prodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      }

      if (!matchedProduct) {
        // Create matching Product for this promo video
        const slug = prodName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
        let validImg = v.thumbnailUrl && !v.thumbnailUrl.includes('facebook.com') && !v.thumbnailUrl.includes('fb.watch') ? v.thumbnailUrl : undefined;
        if (!validImg && v.videoUrl) {
          const ytMatch = v.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
          if (ytMatch && ytMatch[1]) validImg = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }

        matchedProduct = await new Product({
          name: prodName,
          slug,
          description: v.description || v.subtitle || `Démonstration et détails du produit "${prodName}" sur Onoot Boutique.`,
          price: v.price && v.price > 0 ? Number(v.price) : 15000,
          discountPrice: v.discountPrice && v.discountPrice > 0 ? Number(v.discountPrice) : undefined,
          isPriceInbox: Boolean(v.isPriceInbox),
          priceInboxText: v.priceInboxText || 'Prix en Inbox',
          category: 'Accessoires',
          stock: 25,
          imageUrl: validImg || undefined,
          images: validImg ? [validImg] : [],
          video: v.videoUrl,
          status: 'Publié',
          rating: 4.8,
          reviewCount: 18,
          salesCount: 42,
        }).save();
      } else {
        // Sync isPriceInbox, prices and real thumbnail
        const updates: any = {};
        if (v.isPriceInbox !== undefined) {
          updates.isPriceInbox = Boolean(v.isPriceInbox);
          updates.priceInboxText = v.priceInboxText || 'Prix en Inbox';
        }
        let validImg = v.thumbnailUrl && !v.thumbnailUrl.includes('facebook.com') && !v.thumbnailUrl.includes('fb.watch') ? v.thumbnailUrl : undefined;
        if (validImg) {
          updates.imageUrl = validImg;
          updates.images = [validImg];
        }
        if (Object.keys(updates).length > 0) {
          await Product.findByIdAndUpdate(matchedProduct._id, updates).catch(() => {});
        }
      }

      if (matchedProduct && (!v.productId || v.productLink === '/products')) {
        await PromoVideo.findByIdAndUpdate(v._id, {
          productId: matchedProduct._id.toString(),
          productLink: `/products/${matchedProduct._id}`,
          productName: prodName,
        });
      }
    }
    logger.info('Synced promo videos with real product catalog entries');
  } catch (err) {
    logger.error({ err }, 'Failed to sync promo videos with products');
  }
}

// Run sync on startup after DB connects
setTimeout(() => {
  syncPromoVideosWithProducts();
}, 2500);

/* ─── PUBLIC ROUTES (FOR BOUTIQUE) ─── */

// GET active promo videos for the storefront with smart product links
router.get("/promo-videos", async (req, res): Promise<void> => {
  try {
    const { placement } = req.query;
    const filter: any = { isActive: true };
    if (placement && placement !== 'all') {
      filter.$or = [{ placement: placement }, { placement: 'all' }];
    }
    const videos = await PromoVideo.find(filter).sort({ order: 1, createdAt: -1 }).lean();

    // Enrich videos with accurate direct product links
    const enriched = await Promise.all(videos.map(async (v: any) => {
      let resolvedLink = v.productLink;
      let matchedProduct = null;

      if (v.productId && mongoose.isValidObjectId(v.productId)) {
        matchedProduct = await Product.findById(v.productId).lean();
      }
      
      if (!matchedProduct && v.productName) {
        matchedProduct = await Product.findOne({ name: new RegExp(v.productName.trim(), "i") }).lean();
      }

      if (!matchedProduct && v.title) {
        const firstWord = v.title.split(" ")[0];
        if (firstWord && firstWord.length > 3) {
          matchedProduct = await Product.findOne({ name: new RegExp(firstWord, "i") }).lean();
        }
      }

      if (matchedProduct) {
        resolvedLink = `/products/${matchedProduct._id}`;
      } else if (v.productId) {
        resolvedLink = `/products/${v.productId}`;
      }

      // Replace any remaining broken mixkit video URL
      let cleanVideoUrl = v.videoUrl;
      if (!cleanVideoUrl || cleanVideoUrl.includes("mixkit.co")) {
        cleanVideoUrl = "https://vjs.zencdn.net/v/oceans.mp4";
      }

      return {
        ...v,
        videoUrl: cleanVideoUrl,
        productLink: resolvedLink || (matchedProduct ? `/products/${matchedProduct._id}` : "/products"),
        productId: matchedProduct ? matchedProduct._id.toString() : (v.productId || null),
        productName: matchedProduct ? matchedProduct.name : (v.productName || v.title),
        isPriceInbox: Boolean(v.isPriceInbox || matchedProduct?.isPriceInbox),
        priceInboxText: v.priceInboxText || matchedProduct?.priceInboxText || 'Prix en Inbox',
        duration: v.duration || undefined,
      };
    }));

    res.json(enriched);
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
      category,
      price,
      discountPrice,
      isPriceInbox,
      priceInboxText,
      duration,
      badge,
      placement,
      isActive,
      order,
    } = req.body;

    if (!title || !videoUrl) {
      res.status(400).json({ error: "Le titre et le lien de la vidéo sont obligatoires." });
      return;
    }

    // Auto-create or link product so this item can be directly viewed and ordered
    let linkedProductId = productId;
    const prodName = (productName && productName.trim() !== '') ? productName.trim() : title.trim();
    const resolvedCat = await resolveCanonicalCategory(category);

    // Nettoyer thumbnail
    let cleanThumb = thumbnailUrl && !thumbnailUrl.includes('facebook.com') && !thumbnailUrl.includes('fb.watch') ? thumbnailUrl : undefined;
    if (!cleanThumb && videoUrl) {
      const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) cleanThumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    if (!linkedProductId) {
      let existingProd = await Product.findOne({ name: new RegExp(`^${prodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (!existingProd) {
        const slug = prodName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
        existingProd = await new Product({
          name: prodName,
          slug,
          description: description || subtitle || `Démonstration du produit "${prodName}"`,
          price: price ? Number(price) : 15000,
          discountPrice: discountPrice ? Number(discountPrice) : undefined,
          isPriceInbox: Boolean(isPriceInbox),
          priceInboxText: priceInboxText || 'Prix en Inbox',
          category: resolvedCat,
          stock: 25,
          imageUrl: cleanThumb || undefined,
          images: cleanThumb ? [cleanThumb] : [],
          video: videoUrl,
          status: 'Publié',
          rating: 4.8,
          reviewCount: 15,
        }).save();
      } else {
        existingProd.category = resolvedCat;
        if (cleanThumb) {
          existingProd.imageUrl = cleanThumb;
          if (!existingProd.images || existingProd.images.length === 0) existingProd.images = [cleanThumb];
        }
        await existingProd.save().catch(() => {});
      }
      linkedProductId = existingProd._id.toString();
    } else {
      // Sync linked product category if provided
      await Product.findByIdAndUpdate(linkedProductId, { 
        category: resolvedCat,
        ...(cleanThumb ? { imageUrl: cleanThumb, images: [cleanThumb] } : {}),
      }).catch(() => {});
    }

    const finalProductLink = linkedProductId ? `/products/${linkedProductId}` : (productLink || '/products');

    const newVideo = new PromoVideo({
      title,
      subtitle,
      description,
      videoUrl,
      thumbnailUrl: cleanThumb,
      productLink: finalProductLink,
      productName: prodName,
      productId: linkedProductId,
      category: resolvedCat,
      price: price ? Number(price) : undefined,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      isPriceInbox: Boolean(isPriceInbox),
      priceInboxText: priceInboxText || 'Prix en Inbox',
      duration: duration ? Number(duration) : undefined,
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
    if (updateData.duration !== undefined) updateData.duration = Number(updateData.duration);
    if (updateData.isPriceInbox !== undefined) updateData.isPriceInbox = Boolean(updateData.isPriceInbox);

    if (updateData.category) {
      updateData.category = await resolveCanonicalCategory(updateData.category);
    }

    let cleanThumb = updateData.thumbnailUrl && !updateData.thumbnailUrl.includes('facebook.com') && !updateData.thumbnailUrl.includes('fb.watch') ? updateData.thumbnailUrl : undefined;
    if (!cleanThumb && updateData.videoUrl) {
      const ytMatch = updateData.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) cleanThumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    if (cleanThumb) {
      updateData.thumbnailUrl = cleanThumb;
    }

    // If productId is provided or existing, sync product with new info and thumbnail
    if (updateData.productId) {
      updateData.productLink = `/products/${updateData.productId}`;
      const prodSync: any = {
        isPriceInbox: updateData.isPriceInbox,
        priceInboxText: updateData.priceInboxText,
        price: updateData.price,
        discountPrice: updateData.discountPrice,
      };
      if (updateData.category) {
        prodSync.category = updateData.category;
      }
      if (cleanThumb) {
        prodSync.imageUrl = cleanThumb;
        prodSync.images = [cleanThumb];
      }
      if (updateData.videoUrl) {
        prodSync.video = updateData.videoUrl;
      }
      await Product.findByIdAndUpdate(updateData.productId, prodSync).catch(() => {});
    }

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
