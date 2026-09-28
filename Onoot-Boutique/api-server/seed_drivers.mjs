import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onootboutique';

const DeliveryDriverSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: true },
    avatarUrl: { type: String, required: false },
    idCardRectoUrl: { type: String, required: false },
    idCardVersoUrl: { type: String, required: false },
    idCardPhotoUrl: { type: String, required: false },
    vehicleType: { type: String, enum: ['moto', 'tricycle', 'voiture'], default: 'moto' },
    licensePlate: { type: String, required: true },
    vehiclePhotoUrl: { type: String, required: false },
    licensePlatePhotoUrl: { type: String, required: false },
    status: { type: String, enum: ['disponible', 'en_course', 'inactif'], default: 'disponible' },
    zone: { type: String, default: 'Abidjan - Toutes zones' },
    deliveriesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    notes: { type: String, required: false },
  },
  { timestamps: true }
);

const DeliveryDriver = mongoose.models.DeliveryDriver || mongoose.model('DeliveryDriver', DeliveryDriverSchema);

const sampleDrivers = [
  {
    firstName: 'Moussa',
    lastName: 'Koné',
    email: 'moussa.kone@onoot.ci',
    phone: '+225 07 12 34 56 78',
    vehicleType: 'moto',
    licensePlate: '8942 HL 01',
    status: 'disponible',
    zone: 'Abidjan - Cocody & Deux Plateaux',
    deliveriesCount: 142,
    rating: 4.9,
    notes: 'Livreur disponible immédiatement. Casque homologué, permis vérifié, connaît parfaitement le secteur Cocody / Angré.',
  },
  {
    firstName: 'Kouamé',
    lastName: 'Yao',
    email: 'kouame.yao@onoot.ci',
    phone: '+225 05 98 76 54 32',
    vehicleType: 'moto',
    licensePlate: '5214 JG 01',
    status: 'en_course',
    zone: 'Abidjan - Marcory & Zone 4',
    deliveriesCount: 89,
    rating: 4.8,
    notes: 'Actuellement en livraison vers Zone 4. Joignable sur WhatsApp, fin de course estimée dans 15 min.',
  },
  {
    firstName: 'Bakary',
    lastName: 'Diomandé',
    email: 'bakary.d@onoot.ci',
    phone: '+225 01 23 45 67 89',
    vehicleType: 'moto',
    licensePlate: '3109 KM 01',
    status: 'inactif',
    zone: 'Abidjan - Yopougon',
    deliveriesCount: 35,
    rating: 4.6,
    notes: 'En repos aujourd\'hui. Moto révisée, disponible dès demain matin.',
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing delivery drivers and insert the 3 samples
  await DeliveryDriver.deleteMany({});
  const inserted = await DeliveryDriver.insertMany(sampleDrivers);
  console.log(`Successfully seeded ${inserted.length} delivery drivers:`);
  inserted.forEach(d => {
    console.log(`- [${d.status.toUpperCase()}] ${d.firstName} ${d.lastName} (${d.phone}) - Plaque: ${d.licensePlate}`);
  });

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
