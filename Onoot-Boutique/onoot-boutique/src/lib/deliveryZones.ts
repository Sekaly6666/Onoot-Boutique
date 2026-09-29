export interface DeliveryZone {
  id: string;
  label: string;
  commune: string;
  fee: number;
  badge?: string;
  isInterior?: boolean;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "cocody",
    label: "Cocody (Angré, Riviera, 2 Plateaux, Danga, etc.)",
    commune: "Cocody",
    fee: 1000,
    badge: "1 000 FCFA",
  },
  {
    id: "koumassi",
    label: "Koumassi",
    commune: "Koumassi",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "marcory",
    label: "Marcory (Zone 4, Biétry, etc.)",
    commune: "Marcory",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "treichville",
    label: "Treichville",
    commune: "Treichville",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "yopougon",
    label: "Yopougon (Niangon, Maroc, Siporex, etc.)",
    commune: "Yopougon",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "abobo",
    label: "Abobo",
    commune: "Abobo",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "port_bouet",
    label: "Port-Bouët (Vridi, Derrière Warf, etc.)",
    commune: "Port-Bouët",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "plateau",
    label: "Plateau",
    commune: "Plateau",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "adjame",
    label: "Adjamé",
    commune: "Adjamé",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "attecoube",
    label: "Attécoubé",
    commune: "Attécoubé",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "bingerville_centre",
    label: "Bingerville (Centre)",
    commune: "Bingerville (Centre)",
    fee: 1500,
    badge: "1 500 FCFA",
  },
  {
    id: "bingerville_eloigne",
    label: "Bingerville (Intérieur / Éloigné)",
    commune: "Bingerville (Intérieur)",
    fee: 2000,
    badge: "2 000 FCFA",
  },
  {
    id: "anyama",
    label: "Anyama",
    commune: "Anyama",
    fee: 2000,
    badge: "2 000 FCFA",
  },
  {
    id: "gonzagueville",
    label: "Gonzagueville",
    commune: "Gonzagueville",
    fee: 2000,
    badge: "2 000 FCFA",
  },
  {
    id: "songon",
    label: "Songon",
    commune: "Songon",
    fee: 2000,
    badge: "2 000 FCFA",
  },
  {
    id: "grand_bassam",
    label: "Grand-Bassam",
    commune: "Grand-Bassam",
    fee: 3000,
    badge: "3 000 FCFA",
  },
  {
    id: "interieur",
    label: "Intérieur du pays (Expédition en gare / car)",
    commune: "Intérieur du pays (Expédition en gare)",
    fee: 2500,
    badge: "2 500 FCFA",
    isInterior: true,
  },
];

export function getDeliveryZoneById(id: string): DeliveryZone {
  return DELIVERY_ZONES.find((z) => z.id === id) || DELIVERY_ZONES[0];
}

export function getDeliveryZoneByCommune(commune?: string): DeliveryZone {
  if (!commune) return DELIVERY_ZONES[0];
  const found = DELIVERY_ZONES.find(
    (z) => z.commune.toLowerCase() === commune.toLowerCase() || z.label.toLowerCase().includes(commune.toLowerCase())
  );
  return found || DELIVERY_ZONES[0];
}
