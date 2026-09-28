import { Router } from 'express';
import { DeliveryDriver } from '../models/DeliveryDriver';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

const router = Router();

// 3 sample drivers (1 disponible, 1 en_course, 1 inactif)
const sampleDrivers = [
  {
    firstName: 'Moussa',
    lastName: 'Koné',
    email: 'moussa.kone@onoot.ci',
    phone: '+225 07 12 34 56 78',
    vehicleType: 'moto' as const,
    licensePlate: '8942 HL 01',
    status: 'disponible' as const,
    zone: 'Abidjan - Cocody & Deux Plateaux',
    deliveriesCount: 142,
    rating: 4.9,
    notes: 'Livreur ponctuel et expérimenté. Équipé d\'un casque homologué et gilet Onoot. Maîtrise parfaitement le secteur Cocody / Angré.',
  },
  {
    firstName: 'Kouamé',
    lastName: 'Yao',
    email: 'kouame.yao@onoot.ci',
    phone: '+225 05 98 76 54 32',
    vehicleType: 'moto' as const,
    licensePlate: '5214 JG 01',
    status: 'en_course' as const,
    zone: 'Abidjan - Marcory, Zone 4 & Treichville',
    deliveriesCount: 89,
    rating: 4.8,
    notes: 'Actuellement en livraison d\'un colis client vers Marcory Zone 4. Disponible immédiatement après cette course.',
  },
  {
    firstName: 'Bakary',
    lastName: 'Diomandé',
    email: 'bakary.d@onoot.ci',
    phone: '+225 01 23 45 67 89',
    vehicleType: 'moto' as const,
    licensePlate: '3109 KM 01',
    status: 'inactif' as const,
    zone: 'Abidjan - Yopougon & Attécoubé',
    deliveriesCount: 35,
    rating: 4.6,
    notes: 'En repos aujourd\'hui. Moto révisée, reprise des livraisons prévue demain matin.',
  },
];

// Helper to auto-seed if collection is empty
const ensureSeedData = async () => {
  try {
    const count = await DeliveryDriver.countDocuments();
    if (count === 0) {
      await DeliveryDriver.insertMany(sampleDrivers);
      logger.info('Auto-seeded 3 delivery drivers (disponible, en_course, inactif)');
    }
  } catch (err) {
    logger.error({ err }, 'Error during auto-seed of delivery drivers');
  }
};

// Secure all delivery driver routes
router.use(requireAdmin);

// Seed route (force re-seed if requested)
router.post('/seed', async (_req, res): Promise<void> => {
  try {
    await DeliveryDriver.deleteMany({});
    const inserted = await DeliveryDriver.insertMany(sampleDrivers);
    res.json({ message: '3 livreurs créés avec succès', count: inserted.length, drivers: inserted });
  } catch (err: any) {
    logger.error({ err }, 'Failed to seed delivery drivers');
    res.status(500).json({ error: err.message || 'Seed failed' });
  }
});

// GET all delivery drivers
router.get('/', async (req, res): Promise<void> => {
  try {
    await ensureSeedData();

    const { search, status, zone } = req.query as any;
    const filter: any = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
        { email: regex },
        { licensePlate: regex },
      ];
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (zone && zone !== 'all') {
      filter.zone = new RegExp(zone, 'i');
    }

    const drivers = await DeliveryDriver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch delivery drivers');
    res.status(500).json({ error: 'Failed to fetch delivery drivers' });
  }
});

// GET single delivery driver by id
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const driver = await DeliveryDriver.findById(req.params.id);
    if (!driver) {
      res.status(404).json({ error: 'Delivery driver not found' });
      return;
    }
    res.json(driver);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch driver details');
    res.status(500).json({ error: 'Failed to fetch driver details' });
  }
});

// POST create delivery driver
router.post('/', async (req, res): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      avatarUrl,
      idCardRectoUrl,
      idCardVersoUrl,
      idCardPhotoUrl,
      vehicleType,
      licensePlate,
      vehiclePhotoUrl,
      licensePlatePhotoUrl,
      status,
      zone,
      notes,
    } = req.body;

    if (!firstName || !lastName || !phone || !licensePlate) {
      res.status(400).json({ error: 'Le prénom, le nom, le téléphone et la plaque sont requis.' });
      return;
    }

    const newDriver = new DeliveryDriver({
      firstName,
      lastName,
      email,
      phone,
      avatarUrl,
      idCardRectoUrl: idCardRectoUrl || idCardPhotoUrl,
      idCardVersoUrl,
      idCardPhotoUrl: idCardRectoUrl || idCardPhotoUrl,
      vehicleType: vehicleType || 'moto',
      licensePlate,
      vehiclePhotoUrl,
      licensePlatePhotoUrl,
      status: status || 'disponible',
      zone: zone || 'Abidjan - Toutes zones',
      notes,
    });

    await newDriver.save();
    res.status(201).json(newDriver);
  } catch (err: any) {
    logger.error({ err }, 'Failed to create delivery driver');
    res.status(400).json({ error: err.message || 'Failed to create delivery driver' });
  }
});

// PUT update delivery driver
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const updated = await DeliveryDriver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    logger.error({ err }, 'Failed to update delivery driver');
    res.status(400).json({ error: err.message || 'Failed to update delivery driver' });
  }
});

// PATCH status
router.patch('/:id/status', async (req, res): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['disponible', 'en_course', 'inactif'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide' });
      return;
    }
    const updated = await DeliveryDriver.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    logger.error({ err }, 'Failed to update driver status');
    res.status(400).json({ error: err.message || 'Failed to update driver status' });
  }
});

// DELETE delivery driver
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const deleted = await DeliveryDriver.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    logger.error({ err }, 'Failed to delete delivery driver');
    res.status(500).json({ error: 'Failed to delete delivery driver' });
  }
});

export default router;
