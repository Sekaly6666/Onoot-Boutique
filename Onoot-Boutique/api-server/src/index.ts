import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });


import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/mongoose";
import bcrypt from 'bcryptjs';
import { Admin } from './models/Admin';

import { Product } from './models/Product';

const initialProducts = [
  { name: "Smartwatch Pro S8", price: 45000, discountPrice: 38000, imageUrl: "/images/smartwatch.png", category: "Montres Connectées", stock: 15, rating: 4.8, reviewCount: 24, featured: true, bestSeller: true, description: "Superbe montre connectée avec suivi santé complet, appels Bluetooth, écran HD et autonomie prolongée." },
  { name: "Écouteurs Bluetooth Pro ANC", price: 25000, discountPrice: 19000, imageUrl: "/images/earbuds.png", category: "Écouteurs", stock: 20, rating: 4.6, reviewCount: 18, featured: true, flashSale: true, description: "Écouteurs sans fil haute fidélité avec réduction active du bruit et boîtier de recharge ultra-compact." },
  { name: "Coque Protection Premium Armor", price: 6000, discountPrice: 5000, imageUrl: "/images/case.png", category: "Accessoires", stock: 35, rating: 4.5, reviewCount: 12, featured: false, description: "Coque antichoc renforcée pour une protection intégrale de votre smartphone." },
  { name: "Batterie Externe 20000mAh Ultra", price: 22000, discountPrice: 18500, imageUrl: "/images/powerbank.png", category: "Accessoires", stock: 18, rating: 4.9, reviewCount: 31, featured: true, bestSeller: true, description: "Batterie portable haute capacité 20000mAh avec charge ultra-rapide Power Delivery." },
  { name: "Chargeur Rapide 65W GaN", price: 14000, discountPrice: 12000, imageUrl: "/images/charger.png", category: "Accessoires", stock: 25, rating: 4.7, reviewCount: 15, featured: false, description: "Chargeur secteur technologie GaN 65W, compact et compatible tous appareils USB-C." },
  { name: "Haut-parleur Bluetooth Portable Bass", price: 32000, discountPrice: 27000, imageUrl: "/images/speaker.png", category: "Audio", stock: 12, rating: 4.8, reviewCount: 22, featured: true, flashSale: true, description: "Enceinte sans fil étanche avec des basses puissantes et autonomie de 12 heures." },
];

async function ensureInitialProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      for (const p of initialProducts) {
        const slug = p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
        await new Product({ ...p, slug, status: 'Publié' }).save();
      }
      logger.info('✅ Initial catalog seeded in database');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to seed initial catalog');
  }
}

async function ensureAdminExists() {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const email = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'adminonoot@boutique.com';
      const plainPwd = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'onootboutique1234';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(plainPwd, salt);
      await new Admin({ email, passwordHash }).save();
      logger.info('✅ Default admin created');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to verify or seed admin account');
  }
}

const rawPort = process.env["PORT"] || "5005";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, "0.0.0.0", async () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening on 0.0.0.0");
  try {
    await connectDB();
    await ensureAdminExists();
    await ensureInitialProducts();
  } catch (err) {
    logger.error({ err }, "Background DB initialization error");
  }
});

