import React from "react";
import { Link } from "wouter";
import { Mail, Phone, MapPin, Lock, Rocket, ShieldCheck, Music2 } from "lucide-react";
import { OnootLogo } from "@/components/ui/OnootLogo";

/* ── Brand icons (minimal inline SVG — not in Lucide) ── */
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-300 pt-14 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <OnootLogo size="md" variant="white" />
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Votre destination premium pour les accessoires tech en Afrique. Qualité, rapidité et confiance.
            </p>
            <div className="flex space-x-3 pt-2">
              <a
                href="https://www.tiktok.com/@onoot_boutique0"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-white text-gray-400 hover:text-[#111827] p-2 rounded-full transition-all duration-200"
                aria-label="TikTok"
              >
                <Music2 size={16} />
              </a>
              <a
                href="https://www.facebook.com/share/1BaonWPXwv/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-[#1877F2] text-gray-400 hover:text-white p-2 rounded-full transition-all duration-200"
                aria-label="Facebook"
              >
                <FacebookIcon size={16} />
              </a>
              <a
                href="https://www.instagram.com/onoo_t?igsh=aXE1cDZiOWg5eGpy"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gradient-to-br hover:from-[#833ab4] hover:to-[#E1306C] text-gray-400 hover:text-white p-2 rounded-full transition-all duration-200"
                aria-label="Instagram"
              >
                <InstagramIcon size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Liens Rapides</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-[#F5C430] transition-colors">Accueil</Link></li>
              <li><Link href="/products" className="hover:text-[#F5C430] transition-colors">Catalogue</Link></li>
              <li><Link href="/products?category=smartwatches" className="hover:text-[#F5C430] transition-colors">Montres Connectées</Link></li>
              <li><Link href="/products?category=earphones" className="hover:text-[#F5C430] transition-colors">Écouteurs</Link></li>
              <li><Link href="/products?onSale=true" className="hover:text-[#F5C430] transition-colors">Promotions</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#F5C430] transition-colors">Mon Compte</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Service Client</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Contactez-nous</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Livraison &amp; Retours</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Conditions générales</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#4BB5E8] shrink-0 mt-0.5" />
                <span className="text-gray-400 leading-snug">Angré 8ème Tranche star 11, Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-[#4BB5E8] shrink-0" />
                <a href="tel:+2250503648312" className="text-gray-400 hover:text-white transition-colors">+225 05 03 64 83 12</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-[#4BB5E8] shrink-0" />
                <a href="mailto:onootboutique@gmail.com" className="text-gray-400 hover:text-white transition-colors break-all">onootboutique@gmail.com</a>
              </li>
            </ul>

            <div className="mt-6 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Suivez-nous</p>
              <div className="flex flex-col gap-2 text-sm">
                <a href="https://www.tiktok.com/@onoot_boutique0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Music2 size={14} /> @onoot_boutique0
                </a>
                <a href="https://www.facebook.com/share/1BaonWPXwv/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-[#1877F2] transition-colors">
                  <FacebookIcon size={14} /> Onoot Boutique
                </a>
                <a href="https://www.instagram.com/onoo_t?igsh=aXE1cDZiOWg5eGpy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-[#E1306C] transition-colors">
                   <InstagramIcon size={14} /> @onoo_t
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <p>&copy; {new Date().getFullYear()} Onoot Boutique. Tous droits réservés.</p>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a
              href="https://wa.me/2250566668039?text=Bonjour%20BSA,%20j%27ai%20d%C3%A9couvert%20votre%20travail%20sur%20le%20site%20Onoot%20Boutique"
              target="_blank"
              rel="noopener noreferrer"
              title="Développé par BSA (+225 05 66 66 80 39)"
              className="text-[11px] text-gray-500/70 hover:text-amber-400 transition-colors inline-flex items-center gap-1 group"
            >
              <span>By</span>
              <span className="font-semibold tracking-wider text-gray-400 group-hover:text-amber-400 font-mono">[BSA]</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Lock size={14} className="text-[#F5C430]" /> Paiement Sécurisé</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Rocket size={14} className="text-[#4BB5E8]" /> Livraison Rapide</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> Qualité Garantie</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
