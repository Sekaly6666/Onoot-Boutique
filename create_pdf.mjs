import fs from 'fs';

// Helper to escape PDF text
function escapePdfText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

class SimplePdfDoc {
  constructor() {
    this.objects = [];
    this.pages = [];
  }

  addObject(content) {
    this.objects.push(content);
    return this.objects.length; // 1-based index
  }

  build() {
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Font object (Helvetica and Helvetica-Bold)
    const fontRegularObj = this.addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
    const fontBoldObj = this.addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);
    const fontObliqueObj = this.addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`);

    // Resources
    const procSetObj = this.addObject(`[ /PDF /Text /ImageB /ImageC /ImageI ]`);

    // We will allocate Pages object index later
    const pagesObjIndex = this.objects.length + 1; // placeholder
    this.objects.push(null); // will replace

    const pageObjRefs = [];

    for (const page of this.pages) {
      // Content stream
      const streamContent = page.getStream();
      const streamLen = Buffer.byteLength(streamContent, 'latin1');
      const contentObj = this.addObject(`<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`);

      // Page object
      const pageObj = this.addObject(`<< /Type /Page /Parent ${pagesObjIndex} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularObj} 0 R /F2 ${fontBoldObj} 0 R /F3 ${fontObliqueObj} 0 R >> /ProcSet ${procSetObj} 0 R >> /Contents ${contentObj} 0 R >>`);
      pageObjRefs.push(`${pageObj} 0 R`);
    }

    // Replace pages object
    this.objects[pagesObjIndex - 1] = `<< /Type /Pages /Kids [ ${pageObjRefs.join(' ')} ] /Count ${pageObjRefs.length} >>`;

    // Catalog object
    const catalogObj = this.addObject(`<< /Type /Catalog /Pages ${pagesObjIndex} 0 R >>`);

    // Now write out the entire PDF with XRef table
    let out = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
    const offsets = [0];

    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(Buffer.byteLength(out, 'latin1'));
      out += `${i + 1} 0 obj\n${this.objects[i]}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(out, 'latin1');
    out += `xref\n0 ${this.objects.length + 1}\n`;
    out += `0000000000 65535 f \n`;
    for (let i = 1; i <= this.objects.length; i++) {
      const off = String(offsets[i]).padStart(10, '0');
      out += `${off} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${this.objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    return Buffer.from(out, 'latin1');
  }
}

class PageBuilder {
  constructor() {
    this.commands = [];
    this.height = 841.89;
    this.width = 595.28;
  }

  // Draw filled rectangle
  fillRect(x, y, w, h, r, g, b) {
    const pdfY = this.height - y - h;
    this.commands.push(`q ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`);
  }

  // Draw stroked rectangle
  strokeRect(x, y, w, h, r, g, b, lineWidth = 1) {
    const pdfY = this.height - y - h;
    this.commands.push(`q ${lineWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S Q`);
  }

  // Draw line
  drawLine(x1, y1, x2, y2, r, g, b, lineWidth = 1) {
    const py1 = this.height - y1;
    const py2 = this.height - y2;
    this.commands.push(`q ${lineWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(2)} ${py1.toFixed(2)} m ${x2.toFixed(2)} ${py2.toFixed(2)} l S Q`);
  }

  // Draw text
  drawText(text, x, y, options = {}) {
    const {
      font = 'F1',
      size = 11,
      color = [0.12, 0.16, 0.23], // slate-800
    } = options;
    const [r, g, b] = color;
    const pdfY = this.height - y - size;
    const escaped = escapePdfText(text);
    this.commands.push(`BT /${font} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${pdfY.toFixed(2)} Td (${escaped}) Tj ET`);
  }

  getStream() {
    return this.commands.join('\n');
  }
}

// Build the 3-Page Executive Document
const doc = new SimplePdfDoc();

// ================= PAGE 1 =================
const p1 = new PageBuilder();

// Header dark banner
p1.fillRect(40, 40, 515.28, 95, 0.059, 0.090, 0.165); // #0F172A
p1.fillRect(40, 40, 6, 95, 0.961, 0.769, 0.188); // Yellow left border #F5C430

// Banner Title
p1.drawText("ONOOT BOUTIQUE", 58, 56, { font: 'F2', size: 20, color: [1, 1, 1] });
p1.drawText("RAPPORT COMPLET D'HEBERGEMENT CLOUD & GUIDE DE DEPLOIEMENT", 58, 80, { font: 'F2', size: 10, color: [0.961, 0.769, 0.188] });
p1.drawText("Depot GitHub : Sekaly6666/Onoot-Boutique  |  Cible : Cote d'Ivoire & Afrique de l'Ouest  |  Date : 2026", 58, 102, { font: 'F1', size: 8.5, color: [0.7, 0.75, 0.82] });

// Section 1: Architecture
p1.drawText("1. ARCHITECTURE TECHNIQUE DU PROJET ONOOT", 40, 155, { font: 'F2', size: 12.5, color: [0.059, 0.090, 0.165] });
p1.drawLine(40, 172, 555, 172, 0.85, 0.88, 0.92, 1.5);

p1.drawText("Le projet est concu selon une architecture moderne separee en trois briques autonomes :", 40, 185, { font: 'F1', size: 10, color: [0.3, 0.35, 0.42] });

// 3 Cards
// Card 1: Boutique
p1.fillRect(40, 205, 165, 85, 0.96, 0.98, 1.0);
p1.strokeRect(40, 205, 165, 85, 0.75, 0.86, 0.98, 1);
p1.fillRect(40, 205, 165, 4, 0.29, 0.71, 0.91); // Blue bar
p1.drawText("Boutique Publique", 50, 218, { font: 'F2', size: 10, color: [0.059, 0.090, 0.165] });
p1.drawText("Frontend React (Vite)", 50, 232, { font: 'F2', size: 8, color: [0.02, 0.45, 0.7] });
p1.drawText("Catalogue, panier, tunnel", 50, 248, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
p1.drawText("commande, bouton WhatsApp,", 50, 258, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
p1.drawText("suivi en temps reel client.", 50, 268, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });

// Card 2: Admin
p1.fillRect(215, 205, 165, 85, 1.0, 0.99, 0.95);
p1.strokeRect(215, 205, 165, 85, 0.98, 0.85, 0.6, 1);
p1.fillRect(215, 205, 165, 4, 0.96, 0.77, 0.19); // Yellow bar
p1.drawText("Espace Administrateur", 225, 218, { font: 'F2', size: 10, color: [0.059, 0.090, 0.165] });
p1.drawText("Frontend React (Vite)", 225, 232, { font: 'F2', size: 8, color: [0.7, 0.45, 0.05] });
p1.drawText("Dashboard KPI, gestion stocks,", 225, 248, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
p1.drawText("attribution livreurs motos,", 225, 258, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
p1.drawText("export rapports Excel, pubs.", 225, 268, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });

// Card 3: Backend & DB
p1.fillRect(390, 205, 165, 85, 0.95, 0.99, 0.96);
p1.strokeRect(390, 205, 165, 85, 0.65, 0.92, 0.72, 1);
p1.fillRect(390, 205, 165, 4, 0.1, 0.72, 0.4); // Green bar
p1.drawText("Serveur API & Base", 400, 218, { font: 'F2', size: 10, color: [0.059, 0.090, 0.165] });
p1.drawText("Node Express + MongoDB", 400, 232, { font: 'F2', size: 8, color: [0.08, 0.5, 0.25] });
p1.drawText("API REST, sessions JWT,", 400, 248, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
p1.drawText("notifications Brevo SMTP,", 400, 258, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
p1.drawText("stockage images & uploads.", 400, 268, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });

// Section 2: Phase 1 Test Gratuit
p1.drawText("2. PHASE 1 : HEBERGEMENT 100% GRATUIT POUR LES TESTS", 40, 315, { font: 'F2', size: 12.5, color: [0.059, 0.090, 0.165] });
p1.drawLine(40, 332, 555, 332, 0.85, 0.88, 0.92, 1.5);

p1.drawText("Pour valider le site de bout en bout sans debourser 1 centime, voici la configuration recommandee :", 40, 345, { font: 'F1', size: 10, color: [0.3, 0.35, 0.42] });

// Table Header
p1.fillRect(40, 365, 515, 24, 0.95, 0.96, 0.98);
p1.strokeRect(40, 365, 515, 24, 0.8, 0.83, 0.88, 1);
p1.drawText("COMPOSANT", 50, 372, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p1.drawText("HEBERGEUR", 160, 372, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p1.drawText("TARIF MENSUEL", 280, 372, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p1.drawText("FONCTIONNALITES & BENEFICES", 390, 372, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });

// Rows
const rowsTest = [
  { c: "Base de donnees", h: "MongoDB Atlas (M0)", p: "0 FCFA (Gratuit a vie)", d: "Cluster 512 Mo cloud securise, backups automatiques." },
  { c: "Backend (api-server)", h: "Render.com / Koyeb", p: "0 FCFA (Free Plan)", d: "Deploiement automatique depuis GitHub, HTTPS SSL inclus." },
  { c: "Frontend Boutique", h: "Vercel", p: "0 FCFA (Hobby Plan)", d: "CDN mondial haute vitesse, deploie a chaque push Git." },
  { c: "Frontend Admin", h: "Vercel (Second Projet)", p: "0 FCFA (Hobby Plan)", d: "URL separee dediee aux gestionnaires et administrateurs." },
];

let curY = 389;
for (const r of rowsTest) {
  p1.fillRect(40, curY, 515, 28, 1, 1, 1);
  p1.strokeRect(40, curY, 515, 28, 0.88, 0.9, 0.93, 1);
  p1.drawText(r.c, 50, curY + 9, { font: 'F2', size: 8.5, color: [0.1, 0.15, 0.22] });
  p1.drawText(r.h, 160, curY + 9, { font: 'F1', size: 8.5, color: [0.15, 0.2, 0.3] });
  p1.drawText(r.p, 280, curY + 9, { font: 'F2', size: 8.5, color: [0.08, 0.6, 0.25] });
  p1.drawText(r.d, 390, curY + 9, { font: 'F1', size: 8, color: [0.35, 0.4, 0.48] });
  curY += 28;
}

// Callout warning
p1.fillRect(40, 520, 515, 65, 1.0, 0.98, 0.92);
p1.strokeRect(40, 520, 515, 65, 0.95, 0.82, 0.5, 1);
p1.fillRect(40, 520, 5, 65, 0.95, 0.6, 0.1);
p1.drawText("INFO TECHNIQUE SUR LE PLAN GRATUIT RENDER :", 55, 532, { font: 'F2', size: 9, color: [0.65, 0.35, 0.05] });
p1.drawText("Sur l'offre gratuite Render, le serveur backend se met en veille apres 15 minutes sans activite.", 55, 547, { font: 'F1', size: 8.5, color: [0.55, 0.3, 0.05] });
p1.drawText("Lors de la premiere connexion d'un utilisateur, il faut compter 30 a 45 secondes pour le reveil.", 55, 559, { font: 'F1', size: 8.5, color: [0.55, 0.3, 0.05] });
p1.drawText("C'est parfait pour les tests et la validation, mais en production un plan actif sans veille est requis.", 55, 571, { font: 'F2', size: 8.5, color: [0.55, 0.3, 0.05] });

// Footer page 1
p1.drawLine(40, 790, 555, 790, 0.88, 0.9, 0.93, 1);
p1.drawText("Onoot Boutique - Rapport Technique d'Hebergement  |  Page 1 sur 3", 40, 802, { font: 'F1', size: 8, color: [0.6, 0.65, 0.7] });

doc.pages.push(p1);

// ================= PAGE 2 =================
const p2 = new PageBuilder();

// Header mini
p2.fillRect(40, 40, 515.28, 45, 0.059, 0.090, 0.165);
p2.drawText("2. GUIDE DE DEPLOIEMENT PAS A PAS (TESTS GRATUITS)", 55, 56, { font: 'F2', size: 12, color: [1, 1, 1] });
p2.drawText("Methode standard de configuration des 4 composants depuis GitHub", 55, 70, { font: 'F1', size: 8.5, color: [0.961, 0.769, 0.188] });

const steps = [
  {
    num: "1",
    title: "Creer la Base de Donnees MongoDB Atlas Gratuite",
    text: "Rendez-vous sur mongodb.com/atlas et connectez-vous. Creez un cluster gratuit M0 dans la region la plus proche (ex: Europe Frankfurt). Creez un utilisateur de base (ex: onoot_admin). Dans Network Access, ajoutez l'IP 0.0.0.0/0 pour permettre a Render de se connecter. Recuperez l'URL de connexion (mongodb+srv://...)."
  },
  {
    num: "2",
    title: "Deployer le Backend (api-server) sur Render.com",
    text: "1. Sur render.com, cliquez sur New + > Web Service et liez votre repo GitHub Sekaly6666/Onoot-Boutique.\n2. Root Directory : Onoot-Boutique/api-server\n3. Build Command : npm install && npm run build\n4. Start Command : node dist/index.mjs\n5. Environment Variables : MONGODB_URI, JWT_SECRET, PORT=5005, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SHOP_EMAIL.\n6. Validez. Render genere l'URL publique de votre backend (ex: https://onoot-api.onrender.com)."
  },
  {
    num: "3",
    title: "Deployer le Frontend Boutique sur Vercel",
    text: "1. Sur vercel.com, cliquez sur Add New > Project et choisissez Sekaly6666/Onoot-Boutique.\n2. Root Directory : onoot-boutique/onoot-boutique\n3. Framework Preset : Vite\n4. Environment Variables : VITE_API_URL = https://onoot-api.onrender.com (l'URL Render du backend).\n5. Cliquez sur Deploy. Vercel compile et livre le site client avec certificat SSL (https://onoot-boutique.vercel.app)."
  },
  {
    num: "4",
    title: "Deployer le Panel Admin sur Vercel",
    text: "1. Sur Vercel, ajoutez un deuxieme projet a partir du meme depot GitHub.\n2. Root Directory : onoot-boutique/admin\n3. Framework Preset : Vite\n4. Environment Variables : VITE_API_URL = https://onoot-api.onrender.com\n5. Cliquez sur Deploy. Vous obtenez l'URL de gestion securisee (ex: https://onoot-admin.vercel.app)."
  }
];

let stepY = 105;
for (const s of steps) {
  p2.fillRect(40, stepY, 26, 26, 0.059, 0.090, 0.165);
  p2.drawText(s.num, 49, stepY + 6, { font: 'F2', size: 12, color: [0.961, 0.769, 0.188] });
  p2.drawText(s.title, 76, stepY + 7, { font: 'F2', size: 10.5, color: [0.059, 0.090, 0.165] });

  const lines = s.text.split('\n');
  let lineY = stepY + 32;
  for (const l of lines) {
    p2.drawText(l, 76, lineY, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });
    lineY += 13;
  }
  stepY = Math.max(stepY + 70, lineY + 12);
}

// Synchronisation automatique
p2.fillRect(40, 680, 515, 60, 0.94, 0.99, 0.95);
p2.strokeRect(40, 680, 515, 60, 0.7, 0.9, 0.75, 1);
p2.fillRect(40, 680, 5, 60, 0.1, 0.72, 0.4);
p2.drawText("AVANTAGE MAJEUR : SYNCHRONISATION CONTINUE (CI/CD)", 55, 692, { font: 'F2', size: 9, color: [0.08, 0.5, 0.25] });
p2.drawText("A chaque fois que vous executez 'git push origin main', Vercel et Render detectent automatiquement", 55, 707, { font: 'F1', size: 8.5, color: [0.1, 0.4, 0.2] });
p2.drawText("les modifications et reconstruisent la boutique et le backend en 1 a 2 minutes sans interruption de service.", 55, 719, { font: 'F1', size: 8.5, color: [0.1, 0.4, 0.2] });

// Footer page 2
p2.drawLine(40, 790, 555, 790, 0.88, 0.9, 0.93, 1);
p2.drawText("Onoot Boutique - Rapport Technique d'Hebergement  |  Page 2 sur 3", 40, 802, { font: 'F1', size: 8, color: [0.6, 0.65, 0.7] });

doc.pages.push(p2);

// ================= PAGE 3 =================
const p3 = new PageBuilder();

// Header mini
p3.fillRect(40, 40, 515.28, 45, 0.059, 0.090, 0.165);
p3.drawText("3. COMPARATIF PRODUCTION : HEBERGEMENTS FIABLES & SECURISES", 55, 56, { font: 'F2', size: 12, color: [1, 1, 1] });
p3.drawText("Solutions professionnelles haut de gamme pour l'e-commerce en Afrique et international", 55, 70, { font: 'F1', size: 8.5, color: [0.961, 0.769, 0.188] });

p3.drawText("Pour le lancement commercial avec de vrais clients, des paiements et des dizaines de commandes par jour,", 40, 105, { font: 'F1', size: 9.5, color: [0.3, 0.35, 0.42] });
p3.drawText("le site doit beneficier d'un serveur toujours actif, rapide, avec stockage persistant pour les photos/videos.", 40, 118, { font: 'F1', size: 9.5, color: [0.3, 0.35, 0.42] });

// Table Header Pro
p3.fillRect(40, 140, 515, 24, 0.95, 0.96, 0.98);
p3.strokeRect(40, 140, 515, 24, 0.8, 0.83, 0.88, 1);
p3.drawText("SOLUTION", 50, 147, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p3.drawText("TYPE", 145, 147, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p3.drawText("TARIF MENSUEL", 230, 147, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p3.drawText("PERFORMANCES & SECURITE", 335, 147, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });
p3.drawText("AVIS", 495, 147, { font: 'F2', size: 8.5, color: [0.25, 0.3, 0.38] });

const rowsPro = [
  {
    name: "Hetzner Cloud (CPX11)",
    type: "VPS Cloud Linux",
    price: "~4,50 EUR (~3 000 FCFA)",
    perf: "4 Go RAM, 2 vCPU AMD, 40 Go NVMe, bande passante 20 To. Stockage persistant illimite pour photos & CNI.",
    verdict: "TOP N 1"
  },
  {
    name: "Hostinger KVM VPS 1",
    type: "VPS Managé",
    price: "~5,99 EUR (~4 000 FCFA)",
    perf: "4 Go RAM, 50 Go NVMe, interface de gestion en francais, sauvegardes hebdo automatiques, support 24/7.",
    verdict: "TRES FACILE"
  },
  {
    name: "Render Team/Starter",
    type: "PaaS Managé",
    price: "~7 USD (~4 500 FCFA)",
    perf: "Pas de gestion de serveur Linux. Toujours allume, SSL automatique, zero maintenance technique.",
    verdict: "ZERO SOUCI"
  },
  {
    name: "OVHcloud VPS Starter",
    type: "VPS Cloud France",
    price: "~5,50 EUR (~3 600 FCFA)",
    perf: "Protection Anti-DDoS integree de qualite professionnelle, bonne liaison vers les reseaux d'Afrique de l'Ouest.",
    verdict: "SECURITE"
  },
  {
    name: "DigitalOcean Basic",
    type: "Cloud Droplet",
    price: "~6 USD (~3 900 FCFA)",
    perf: "Plateforme cloud de reference mondiale, surveillance des pannes, IP fixe propre, snapshots sauvegardes.",
    verdict: "STANDARD"
  }
];

let pY = 164;
for (const r of rowsPro) {
  p3.fillRect(40, pY, 515, 34, 1, 1, 1);
  p3.strokeRect(40, pY, 515, 34, 0.88, 0.9, 0.93, 1);
  p3.drawText(r.name, 50, pY + 8, { font: 'F2', size: 8.5, color: [0.08, 0.12, 0.2] });
  p3.drawText(r.type, 145, pY + 8, { font: 'F1', size: 8, color: [0.4, 0.45, 0.52] });
  p3.drawText(r.price, 230, pY + 8, { font: 'F2', size: 8, color: [0.08, 0.6, 0.25] });
  p3.drawText(r.perf, 335, pY + 5, { font: 'F1', size: 7.5, color: [0.3, 0.35, 0.42] });
  p3.drawText(r.verdict, 495, pY + 8, { font: 'F2', size: 7.5, color: [0.1, 0.45, 0.8] });
  pY += 34;
}

// RECOMMANDATION FINALE D'EXPERT
p3.fillRect(40, 360, 515, 175, 0.95, 0.98, 1.0);
p3.strokeRect(40, 360, 515, 175, 0.65, 0.82, 0.98, 1.5);
p3.fillRect(40, 360, 6, 175, 0.29, 0.71, 0.91); // Blue accent

p3.drawText("RECOMMANDATION FINALE DE L'EXPERT POUR ONOOT BOUTIQUE :", 55, 375, { font: 'F2', size: 10.5, color: [0.03, 0.35, 0.6] });

p3.drawText("1. FRONTENDS (Boutique & Admin) : Garder VERCEL (0 FCFA/mois)", 55, 395, { font: 'F2', size: 9, color: [0.059, 0.090, 0.165] });
p3.drawText("Vercel dispose de serveurs Edge CDN repartis sur toute la planete. Vos pages s'affichent instantanement", 55, 408, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });
p3.drawText("a Abidjan, Bouake, San Pedro ou a l'etranger, et cela reste 100% gratuit avec certificat SSL automatique.", 55, 419, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });

p3.drawText("2. BACKEND & FICHIERS : Hetzner Cloud VPS CPX11 ou Hostinger (~3 000 a 4 000 FCFA/mois)", 55, 440, { font: 'F2', size: 9, color: [0.059, 0.090, 0.165] });
p3.drawText("Contrairement aux services gratuits, un petit VPS garantit que votre serveur ne s'eteint JAMAIS, vos images", 55, 453, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });
p3.drawText("et pieces justificatives de livreurs (CNI, plaques) sont conservees sur le disque SSD sans aucun risque d'effacement.", 55, 464, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });

p3.drawText("3. NOM DE DOMAINE PROFESSIONNEL (.ci ou .com) : ~6 000 a 15 000 FCFA/an", 55, 485, { font: 'F2', size: 9, color: [0.059, 0.090, 0.165] });
p3.drawText("Acheter onootboutique.com ou onoot.ci donnera une confiance maximale a vos clients et partenaires bancaires.", 55, 498, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });
p3.drawText("Les sous-domaines seront configures proprement : boutique.onoot.ci, admin.onoot.ci, api.onoot.ci.", 55, 509, { font: 'F1', size: 8.5, color: [0.3, 0.35, 0.42] });

// RECAPITULATIF BUDGET TOTAL
p3.fillRect(40, 555, 515, 100, 0.98, 0.98, 0.99);
p3.strokeRect(40, 555, 515, 100, 0.85, 0.88, 0.92, 1);
p3.drawText("RECAPITULATIF BUDGETAIRE MENSUEL ONOOT BOUTIQUE :", 55, 570, { font: 'F2', size: 9.5, color: [0.059, 0.090, 0.165] });

p3.drawText("- En Phase de Test :  0 FCFA / mois  (Vercel + Render Free + MongoDB Atlas Free)", 55, 590, { font: 'F2', size: 9, color: [0.08, 0.6, 0.25] });
p3.drawText("- En Production Recommandee :  ~3 500 FCFA / mois  (Vercel Gratuit + VPS Hetzner + Atlas)", 55, 608, { font: 'F2', size: 9, color: [0.1, 0.45, 0.8] });
p3.drawText("- En Production Zero-Maintenance :  ~8 000 FCFA / mois  (Vercel Gratuit + Render Starter)", 55, 626, { font: 'F2', size: 9, color: [0.7, 0.45, 0.05] });

// Footer page 3
p3.drawLine(40, 790, 555, 790, 0.88, 0.9, 0.93, 1);
p3.drawText("Onoot Boutique - Rapport Technique d'Hebergement  |  Page 3 sur 3", 40, 802, { font: 'F1', size: 8, color: [0.6, 0.65, 0.7] });

doc.pages.push(p3);

// Output to file
const pdfBuffer = doc.build();
const outPath = 'c:/Users/sekou/Desktop/Onoot-Boutique/Rapport_Hebergement_Onoot_Boutique.pdf';
fs.writeFileSync(outPath, pdfBuffer);
console.log(`PDF généré avec succès (${pdfBuffer.length} octets) : ${outPath}`);
