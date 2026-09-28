import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onootboutique';

// ── Schemas (inline, no imports needed) ─────────────────────────────────────

const CategorySchema = new mongoose.Schema(
  { name: String, slug: String, description: String, image: String },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    description: String,
    price: Number,
    discountPrice: Number,
    category: String,
    subCategory: String,
    brand: String,
    stock: { type: Number, default: 50 },
    images: [String],
    colors: [String],
    tags: [String],
    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);

// ── Seed Data ────────────────────────────────────────────────────────────────

const categories = [
  { name: 'Robes', slug: 'robes', description: 'Robes élégantes pour toutes les occasions', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' },
  { name: 'Chaussures', slug: 'chaussures', description: 'Chaussures tendance et confortables', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
  { name: 'Sacs', slug: 'sacs', description: 'Sacs et accessoires de qualité', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
  { name: 'Bijoux', slug: 'bijoux', description: 'Bijoux et accessoires raffinés', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
  { name: 'Vêtements', slug: 'vetements', description: 'Prêt-à-porter moderne et stylé', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400' },
  { name: 'Parfums', slug: 'parfums', description: 'Parfums et soins de luxe', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400' },
];

const products = [
  // ── ROBES ──
  {
    name: 'Robe Florale Été',
    slug: 'robe-florale-ete',
    description: 'Une robe légère et élégante avec un imprimé floral coloré, parfaite pour les journées estivales. Tissu fluide en viscose douce.',
    price: 59.99,
    discountPrice: 44.99,
    category: 'robes',
    subCategory: 'casual',
    brand: 'Onoot',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
    ],
    colors: ['rose', 'bleu', 'vert'],
    tags: ['été', 'floral', 'casual'],
    featured: true,
    bestSeller: true,
    rating: 4.7,
    reviewCount: 128,
    salesCount: 340,
  },
  {
    name: 'Robe Cocktail Noire',
    slug: 'robe-cocktail-noire',
    description: 'Robe cocktail élégante en crêpe noir, coupe asymétrique. Idéale pour les soirées et événements formels.',
    price: 89.99,
    category: 'robes',
    subCategory: 'soirée',
    brand: 'Onoot',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    ],
    colors: ['noir', 'bordeaux'],
    tags: ['soirée', 'élégante', 'cocktail'],
    featured: true,
    rating: 4.5,
    reviewCount: 87,
    salesCount: 210,
  },
  {
    name: 'Robe Bohème Maxi',
    slug: 'robe-boheme-maxi',
    description: 'Longue robe bohème avec broderies ethniques. Tissu 100% coton, parfaite pour un look décontracté et chic.',
    price: 74.99,
    discountPrice: 59.99,
    category: 'robes',
    subCategory: 'bohème',
    brand: 'EthnoStyle',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600',
    ],
    colors: ['beige', 'terracotta', 'blanc'],
    tags: ['bohème', 'maxi', 'été'],
    bestSeller: true,
    rating: 4.8,
    reviewCount: 203,
    salesCount: 520,
  },

  // ── CHAUSSURES ──
  {
    name: 'Escarpins Dorés',
    slug: 'escarpins-dores',
    description: 'Escarpins à talon aiguille dorés, bout pointu. Élévation de 10 cm pour une allure haute couture.',
    price: 79.99,
    category: 'chaussures',
    subCategory: 'escarpins',
    brand: 'GlamShoe',
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
      'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600',
    ],
    colors: ['or', 'argent'],
    tags: ['soirée', 'talon', 'élégant'],
    featured: true,
    rating: 4.4,
    reviewCount: 65,
    salesCount: 180,
  },
  {
    name: 'Sneakers Blanches Mode',
    slug: 'sneakers-blanches-mode',
    description: 'Sneakers lifestyle tendance, semelle épaisse plateforme. Cuir synthétique premium, ultra confortables.',
    price: 64.99,
    discountPrice: 49.99,
    category: 'chaussures',
    subCategory: 'sneakers',
    brand: 'StreetLook',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
    ],
    colors: ['blanc', 'noir', 'rose poudré'],
    tags: ['casual', 'sport', 'tendance'],
    bestSeller: true,
    rating: 4.6,
    reviewCount: 312,
    salesCount: 780,
  },
  {
    name: 'Sandales Tressées',
    slug: 'sandales-tressees',
    description: 'Sandales plates à tiges tressées en cuir naturel. Confort et style pour l\'été.',
    price: 39.99,
    category: 'chaussures',
    subCategory: 'sandales',
    brand: 'NaturWalk',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600',
    ],
    colors: ['camel', 'noir', 'blanc'],
    tags: ['été', 'plage', 'casual'],
    rating: 4.3,
    reviewCount: 94,
    salesCount: 260,
  },

  // ── SACS ──
  {
    name: 'Sac à Main Structuré',
    slug: 'sac-main-structure',
    description: 'Sac à main en cuir vegan, structure rigide avec poignée et bandoulière amovible. Compartiment principal + poche intérieure.',
    price: 99.99,
    discountPrice: 79.99,
    category: 'sacs',
    subCategory: 'sac à main',
    brand: 'Onoot',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    ],
    colors: ['noir', 'camel', 'bordeaux'],
    tags: ['classique', 'bureau', 'élégant'],
    featured: true,
    bestSeller: true,
    rating: 4.9,
    reviewCount: 445,
    salesCount: 890,
  },
  {
    name: 'Tote Bag Canvas',
    slug: 'tote-bag-canvas',
    description: 'Grand tote bag en canvas épais, anses longues. Pratique pour les courses ou la plage.',
    price: 29.99,
    category: 'sacs',
    subCategory: 'tote',
    brand: 'EcoCarry',
    stock: 80,
    images: [
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600',
    ],
    colors: ['naturel', 'noir', 'kaki'],
    tags: ['casual', 'éco', 'plage'],
    rating: 4.2,
    reviewCount: 167,
    salesCount: 430,
  },
  {
    name: 'Mini Sac Chaîne',
    slug: 'mini-sac-chaine',
    description: 'Mini sac baguette avec chaîne dorée, tendance et compact. Fermeture à boucle magnétique.',
    price: 54.99,
    category: 'sacs',
    subCategory: 'mini sac',
    brand: 'GlamStyle',
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600',
    ],
    colors: ['beige', 'noir', 'blanc'],
    tags: ['soirée', 'mini', 'chaîne'],
    featured: true,
    rating: 4.6,
    reviewCount: 89,
    salesCount: 230,
  },

  // ── BIJOUX ──
  {
    name: 'Collier Perles Dorées',
    slug: 'collier-perles-dorees',
    description: 'Collier ras-de-cou avec perles en verre dorées, fermoir en acier inoxydable. Longueur ajustable.',
    price: 24.99,
    discountPrice: 18.99,
    category: 'bijoux',
    subCategory: 'colliers',
    brand: 'AuraBijoux',
    stock: 70,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
    ],
    colors: ['or', 'argent'],
    tags: ['collier', 'perles', 'élégant'],
    bestSeller: true,
    rating: 4.7,
    reviewCount: 233,
    salesCount: 610,
  },
  {
    name: 'Boucles d\'Oreilles Créoles',
    slug: 'boucles-oreilles-creoles',
    description: 'Grandes créoles en acier inoxydable plaqué or, anti-allergiques. Diamètre 5 cm.',
    price: 19.99,
    category: 'bijoux',
    subCategory: 'boucles d\'oreilles',
    brand: 'AuraBijoux',
    stock: 90,
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
    ],
    colors: ['or', 'argent', 'rose gold'],
    tags: ['créoles', 'tendance', 'casual'],
    rating: 4.5,
    reviewCount: 178,
    salesCount: 450,
  },

  // ── VÊTEMENTS ──
  {
    name: 'Blazer Oversize Camel',
    slug: 'blazer-oversize-camel',
    description: 'Blazer oversize en tissu structuré couleur camel. Coupe moderne, poches fonctionnelles, doublure intérieure.',
    price: 89.99,
    discountPrice: 69.99,
    category: 'vetements',
    subCategory: 'blazers',
    brand: 'Onoot',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4b4d97?w=600',
      'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600',
    ],
    colors: ['camel', 'noir', 'gris'],
    tags: ['bureau', 'élégant', 'oversize'],
    featured: true,
    rating: 4.8,
    reviewCount: 156,
    salesCount: 380,
  },
  {
    name: 'Jean Taille Haute',
    slug: 'jean-taille-haute',
    description: 'Jean slim taille haute en denim stretch 98% coton. Coupe flatteuse qui affine la silhouette.',
    price: 54.99,
    category: 'vetements',
    subCategory: 'jeans',
    brand: 'DenimLux',
    stock: 55,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600',
    ],
    colors: ['bleu foncé', 'noir', 'bleu clair'],
    tags: ['denim', 'casual', 'everyday'],
    bestSeller: true,
    rating: 4.6,
    reviewCount: 289,
    salesCount: 720,
  },
  {
    name: 'Top en Soie Fluide',
    slug: 'top-soie-fluide',
    description: 'Top à encolure en V en soie fluide, bretelles fines ajustables. Tombé parfait, sensation douce sur la peau.',
    price: 44.99,
    discountPrice: 34.99,
    category: 'vetements',
    subCategory: 'tops',
    brand: 'Onoot',
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
    ],
    colors: ['ivoire', 'noir', 'rose poudré', 'vert sauge'],
    tags: ['soirée', 'été', 'élégant'],
    featured: true,
    rating: 4.7,
    reviewCount: 112,
    salesCount: 290,
  },

  // ── PARFUMS ──
  {
    name: 'Eau de Parfum Rose Oud',
    slug: 'eau-parfum-rose-oud',
    description: 'Fragrance orientale envoûtante alliant la rose de Damas et le bois de oud. Tenue longue durée 8-10h. 50ml.',
    price: 69.99,
    category: 'parfums',
    subCategory: 'eau de parfum',
    brand: 'ScentLux',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600',
      'https://images.unsplash.com/photo-1588776814546-1ffbb3bf6e68?w=600',
    ],
    colors: [],
    tags: ['oriental', 'floral', 'oud', 'luxe'],
    featured: true,
    bestSeller: true,
    rating: 4.9,
    reviewCount: 387,
    salesCount: 830,
  },
  {
    name: 'Brume Florale Légère',
    slug: 'brume-florale-legere',
    description: 'Brume parfumée légère aux notes de jasmin et de fleur d\'oranger. Idéale pour rafraîchir. 100ml.',
    price: 29.99,
    category: 'parfums',
    subCategory: 'brumes',
    brand: 'FloraFresh',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600',
    ],
    colors: [],
    tags: ['frais', 'floral', 'quotidien'],
    rating: 4.4,
    reviewCount: 143,
    salesCount: 370,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to:', MONGODB_URI);

  // Clear existing data
  console.log('🗑️  Clearing existing products and categories...');
  await Category.deleteMany({});
  await Product.deleteMany({});

  // Insert categories
  console.log('📂 Inserting categories...');
  const insertedCats = await Category.insertMany(categories);
  console.log(`   ✅ ${insertedCats.length} categories inserted`);

  // Insert products
  console.log('📦 Inserting products...');
  const insertedProds = await Product.insertMany(products);
  console.log(`   ✅ ${insertedProds.length} products inserted`);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`   📂 ${insertedCats.length} categories`);
  console.log(`   📦 ${insertedProds.length} products`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
