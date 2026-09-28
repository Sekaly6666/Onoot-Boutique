import mongoose from 'mongoose';
import { Product } from './src/models/Product';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../../.env') });

const exampleProducts = [
  { name: "Smartwatch Pro S8", price: 45000, discountPrice: 38000, imageUrl: "/images/smartwatch.png", category: "Montres Connectées", stock: 10, rating: 4.5, reviewCount: 24, featured: true, description: "Superbe montre connectée avec suivi santé, appels et notifications." },
  { name: "Écouteurs Bluetooth", price: 18000, discountPrice: null, imageUrl: "/images/earbuds.png", category: "Écouteurs", stock: 15, rating: 4.2, reviewCount: 18, featured: false, description: "Écouteurs sans fil avec une excellente qualité sonore et réduction de bruit passive." },
  { name: "Coque Protection Premium", price: 5000, discountPrice: null, imageUrl: "/images/case.png", category: "Coques", stock: 30, rating: 4.0, reviewCount: 12, featured: false, description: "Coque renforcée pour protéger votre téléphone contre les chutes." },
  { name: "Batterie Externe 20000mAh", price: 22000, discountPrice: 19000, imageUrl: "/images/powerbank.png", category: "Batteries", stock: 8, rating: 4.7, reviewCount: 31, featured: true, description: "Ne tombez plus en panne de batterie. Capacité de 20000mAh pour recharger plusieurs fois votre appareil." },
  { name: "Chargeur Rapide 65W", price: 12000, discountPrice: null, imageUrl: "/images/charger.png", category: "Chargeurs", stock: 20, rating: 4.3, reviewCount: 9, featured: false, description: "Chargeur mural ultra rapide avec technologie GaN." },
  { name: "Haut-parleur Portable", price: 30000, discountPrice: 25000, imageUrl: "/images/speaker.png", category: "Haut-parleurs", stock: 5, rating: 4.6, reviewCount: 41, featured: true, description: "Haut-parleur Bluetooth étanche avec des basses puissantes." },
  { name: "Smartwatch Sport Ultra", price: 55000, discountPrice: null, imageUrl: "/images/smartwatch.png", category: "Montres Connectées", stock: 7, rating: 4.8, reviewCount: 56, featured: true, description: "Conçue pour les sportifs de haut niveau. Étanchéité renforcée." },
  { name: "Écouteurs ANC Pro", price: 35000, discountPrice: 29000, imageUrl: "/images/earbuds.png", category: "Écouteurs", stock: 12, rating: 4.4, reviewCount: 27, featured: false, description: "Réduction de bruit active premium pour vous immerger dans votre musique." },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/onootboutique";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoUri);
    
    // Publish all existing products just in case
    await Product.updateMany({}, { $set: { status: 'Publié' } });
    console.log("All existing products marked as 'Publié'.");

    console.log("Seeding example products if missing...");
    for (const p of exampleProducts) {
      const exists = await Product.findOne({ name: p.name });
      if (!exists) {
        const slug = p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
        await Product.create({ ...p, slug, status: 'Publié' });
        console.log(`Added: ${p.name}`);
      }
    }
    
    console.log("Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
