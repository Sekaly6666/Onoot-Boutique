export interface DeliveryZone {
  id: string;
  label: string;
  commune: string;
  fee: number;
  badge: string;
  keywords: string[];
  isInterior?: boolean;
}

export const WHATSAPP_SHOP_NUMBER = "2250503648312";

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "cocody",
    label: "Cocody (Angré, Riviera, 2 Plateaux, Danga, etc.)",
    commune: "Cocody",
    fee: 1000,
    badge: "1 000 FCFA",
    keywords: [
      "cocody",
      "angré",
      "angre",
      "riviera",
      "2 plateaux",
      "deux plateaux",
      "danga",
      "mermoz",
      "vallon",
      "palmeraie",
      "faya",
      "abatta",
      "akouédo",
      "akouedo",
      "bonoumin",
      "attoban",
      "ambassades",
      "saint jean",
      "cite des arts",
      "château",
      "chateau",
      "8eme tranche",
      "7eme tranche",
      "9eme tranche",
    ],
  },
  {
    id: "koumassi",
    label: "Koumassi",
    commune: "Koumassi",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "koumassi",
      "remblais",
      "inchallah",
      "campement",
      "soweto",
      "djorogobité",
      "05",
      "prodomo",
      "divo",
      "grand carrefour",
    ],
  },
  {
    id: "marcory",
    label: "Marcory (Zone 4, Biétry, etc.)",
    commune: "Marcory",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "marcory",
      "zone 4",
      "zone 4c",
      "bietry",
      "biétry",
      "anoumabo",
      "hibiscus",
      "residentiel",
      "résidentiel",
      "aliodan",
      "champroux",
      "sicogi",
      "foyer",
    ],
  },
  {
    id: "treichville",
    label: "Treichville",
    commune: "Treichville",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "treichville",
      "arbois",
      "avenue",
      "palais des sports",
      "belleville",
      "solibra",
      "gare de bassam",
      "bellevue",
      "chru",
      "centre pilote",
    ],
  },
  {
    id: "yopougon",
    label: "Yopougon (Niangon, Maroc, Siporex, etc.)",
    commune: "Yopougon",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "yopougon",
      "yop",
      "niangon",
      "maroc",
      "siporex",
      "sideci",
      "selmer",
      "toit rouge",
      "bel air",
      "académie",
      "millionnaire",
      "koweit",
      "port-bouet 2",
      "port bouet 2",
      "kenya",
      "sicogi",
      "wassakara",
      "ananeraie",
      "gesco",
      "saint andre",
      "figayo",
      "zone industrielle",
    ],
  },
  {
    id: "abobo",
    label: "Abobo",
    commune: "Abobo",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "abobo",
      "dokui",
      "anador",
      "avocatier",
      "pk18",
      "baoulé",
      "clouetcha",
      "samaké",
      "sagbé",
      "derrière rails",
      "agbekoi",
      "n'dotré",
      "ndotre",
      "gare abobo",
      "mairie abobo",
      "bocabo",
    ],
  },
  {
    id: "port_bouet",
    label: "Port-Bouët (Vridi, Derrière Warf, etc.)",
    commune: "Port-Bouët",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "port-bouët",
      "port bouet",
      "vridi",
      "derrière warf",
      "derriere warf",
      "adjamé",
      "jean foley",
      "phare",
      "aéroport",
      "aeroport",
      "abidjan sud",
      "canal",
      "abattoir",
    ],
  },
  {
    id: "plateau",
    label: "Plateau",
    commune: "Plateau",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: ["plateau", "centre ville", "commerce", "cité administrative", "banque", "pyramide", "stade felix"],
  },
  {
    id: "adjame",
    label: "Adjamé",
    commune: "Adjamé",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: [
      "adjamé",
      "adjame",
      "liberté",
      "liberte",
      "220 logements",
      "renault",
      "williamsville",
      "mirador",
      "forum",
      "bracodi",
      "paillet",
    ],
  },
  {
    id: "attecoube",
    label: "Attécoubé",
    commune: "Attécoubé",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: ["attécoubé", "attecoube", "agban", "santai", "boribana", "locodjro", "abobo doume", "santé"],
  },
  {
    id: "bingerville_centre",
    label: "Bingerville (Centre)",
    commune: "Bingerville (Centre)",
    fee: 1500,
    badge: "1 500 FCFA",
    keywords: ["bingerville centre", "bingerville", "feh kesse", "feh kessé", "savane", "marché bingerville", "hopital bingerville"],
  },
  {
    id: "bingerville_eloigne",
    label: "Bingerville (Intérieur / Éloigné)",
    commune: "Bingerville (Intérieur)",
    fee: 2000,
    badge: "2 000 FCFA",
    keywords: ["bingerville interieur", "bingerville intérieur", "bingerville eloigne", "akouai santai", "sebroko", "m'batto", "mbatto", "palmeraie bingerville"],
  },
  {
    id: "anyama",
    label: "Anyama",
    commune: "Anyama",
    fee: 2000,
    badge: "2 000 FCFA",
    keywords: ["anyama", "ebimpé", "ebimpe", "stade alassane ouattara", "azaguié", "belle ville anyama", "gare anyama"],
  },
  {
    id: "gonzagueville",
    label: "Gonzagueville",
    commune: "Gonzagueville",
    fee: 2000,
    badge: "2 000 FCFA",
    keywords: ["gonzague", "gonzagueville", "corridor gonzague", "anani", "terre rouge", "carrefour koweït"],
  },
  {
    id: "songon",
    label: "Songon",
    commune: "Songon",
    fee: 2000,
    badge: "2 000 FCFA",
    keywords: ["songon", "songon agban", "songon dagbé", "dabou road", "songon m'brathé"],
  },
  {
    id: "grand_bassam",
    label: "Grand-Bassam",
    commune: "Grand-Bassam",
    fee: 3000,
    badge: "3 000 FCFA",
    keywords: ["bassam", "grand-bassam", "grand bassam", "moossou", "rosiers", "impérial", "france", "quartier france", "phare bassam"],
  },
  {
    id: "interieur",
    label: "Expédition Hors d'Abidjan (Intérieur du pays en gare)",
    commune: "Intérieur du pays (Expédition en gare)",
    fee: 0,
    badge: "À convenir sur WhatsApp",
    isInterior: true,
    keywords: [
      "interieur",
      "intérieur",
      "hors abidjan",
      "bouake",
      "bouaké",
      "yamoussoukro",
      "yakro",
      "korhogo",
      "san pedro",
      "san-pédro",
      "daloa",
      "gagnoa",
      "man",
      "abengourou",
      "soubre",
      "soubré",
      "divo",
      "oumé",
      "ferke",
      "gare",
      "utb",
      "cte",
      "stif",
      "compagnie",
    ],
  },
];

export function getDeliveryZoneById(id: string): DeliveryZone {
  return DELIVERY_ZONES.find((z) => z.id === id) || DELIVERY_ZONES[0];
}

export function getDeliveryZoneByCommune(commune?: string): DeliveryZone {
  if (!commune) return DELIVERY_ZONES[0];
  const found = DELIVERY_ZONES.find(
    (z) =>
      z.commune.toLowerCase() === commune.toLowerCase() ||
      z.label.toLowerCase().includes(commune.toLowerCase())
  );
  return found || DELIVERY_ZONES[0];
}

export function searchDeliveryZones(query: string): DeliveryZone[] {
  if (!query || !query.trim()) return DELIVERY_ZONES;
  const q = query.trim().toLowerCase();

  return DELIVERY_ZONES.filter((zone) => {
    if (zone.label.toLowerCase().includes(q)) return true;
    if (zone.commune.toLowerCase().includes(q)) return true;
    return zone.keywords.some((kw) => kw.includes(q) || q.includes(kw));
  });
}

/**
 * Détection automatique de la commune à partir des coordonnées GPS (OpenStreetMap Reverse Geocoding)
 */
export async function detectZoneFromCoordinates(latitude: number, longitude: number): Promise<{ zone: DeliveryZone; addressDetails: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        headers: { "Accept-Language": "fr" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const address = data.address || {};
    const textToMatch = [
      address.suburb,
      address.city_district,
      address.town,
      address.neighbourhood,
      address.city,
      address.county,
      data.display_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // 1. Chercher d'abord dans les communes d'Abidjan & périphérie
    for (const zone of DELIVERY_ZONES) {
      if (zone.isInterior) continue;
      for (const kw of zone.keywords) {
        if (textToMatch.includes(kw.toLowerCase())) {
          const detail = address.suburb || address.neighbourhood || address.city_district || zone.commune;
          return { zone, addressDetails: detail };
        }
      }
    }

    // 2. Si les coordonnées sont dans le grand Abidjan (~lat 5.15 - 5.50, lon -4.20 - -3.85)
    if (latitude >= 5.15 && latitude <= 5.50 && longitude >= -4.25 && longitude <= -3.85) {
      const defaultAbidjan = DELIVERY_ZONES.find((z) => z.id === "cocody") || DELIVERY_ZONES[0];
      return { zone: defaultAbidjan, addressDetails: "Abidjan" };
    }

    // 3. Hors d'Abidjan (Intérieur du pays)
    const interiorZone = DELIVERY_ZONES.find((z) => z.isInterior);
    if (interiorZone) {
      const cityName = address.city || address.town || address.village || address.state || "Intérieur du pays";
      return { zone: interiorZone, addressDetails: cityName };
    }

    return null;
  } catch (err) {
    console.warn("GPS reverse geocoding error or timeout:", err);
    return null;
  }
}

/**
 * Crée le lien WhatsApp pré-rempli pour convenir des frais d'expédition en gare
 */
export function buildInteriorWhatsAppUrl({
  items,
  itemsTotal,
  destinationCity,
  preferredStation,
}: {
  items: Array<{ name: string; quantity: number; price: number }>;
  itemsTotal: number;
  destinationCity?: string;
  preferredStation?: string;
}): string {
  const itemsText = items.map((it) => `• ${it.quantity}x ${it.name} (${(it.price * it.quantity).toLocaleString("fr-FR")} FCFA)`).join("\n");
  const cityText = destinationCity?.trim() ? destinationCity.trim() : "Non précisée";
  const stationText = preferredStation?.trim() ? ` (Compagnie / Gare : ${preferredStation.trim()})` : "";

  const message = `Bonjour Onoot Boutique,\n\nJe souhaite passer une commande pour expédition Hors d'Abidjan :\n\n${itemsText}\n\nSous-total articles : ${itemsTotal.toLocaleString("fr-FR")} FCFA\nVille de destination : ${cityText}${stationText}\n\nPourriez-vous m'indiquer les frais d'expédition en gare s'il vous plaît ? Merci !`;

  return `https://wa.me/${WHATSAPP_SHOP_NUMBER}?text=${encodeURIComponent(message)}`;
}
