import React from "react";
import { Link } from "wouter";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { OnootLogo } from "@/components/ui/OnootLogo";

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <OnootLogo size="md" variant="white" />
            <p className="text-sm text-gray-400 mt-2">
              Votre destination premium pour les accessoires tech en Afrique. Qualité, rapidité et confiance.
            </p>
            <div className="flex space-x-4 pt-1">
              <a
                href="https://www.tiktok.com/@onoot_boutique0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon size={20} />
              </a>
              <a
                href="https://www.facebook.com/share/1BaonWPXwv/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#1877F2] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/onoo_t?igsh=aXE1cDZiOWg5eGpy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E1306C] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-[#F5C430] transition-colors">Accueil</Link></li>
              <li><Link href="/products" className="hover:text-[#F5C430] transition-colors">Catalogue</Link></li>
              <li><Link href="/products?category=smartwatches" className="hover:text-[#F5C430] transition-colors">Montres Connectées</Link></li>
              <li><Link href="/products?category=earphones" className="hover:text-[#F5C430] transition-colors">Écouteurs</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#F5C430] transition-colors">Mon Compte</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Service Client</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Contactez-nous</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Livraison & Retours</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-[#F5C430] transition-colors">Conditions générales</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-[#4BB5E8] shrink-0" />
                <span>Plateau, Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-[#4BB5E8] shrink-0" />
                <span>+225 01 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-[#4BB5E8] shrink-0" />
                <span>contact@onoot.com</span>
              </li>
            </ul>

            <div className="mt-6 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Suivez-nous</p>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href="https://www.tiktok.com/@onoot_boutique0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <TikTokIcon size={16} />
                  @onoot_boutique0
                </a>
                <a
                  href="https://www.facebook.com/share/1BaonWPXwv/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-[#1877F2] transition-colors"
                >
                  <Facebook size={16} />
                  Onoot Boutique
                </a>
                <a
                  href="https://www.instagram.com/onoo_t?igsh=aXE1cDZiOWg5eGpy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-[#E1306C] transition-colors"
                >
                  <Instagram size={16} />
                  @onoo_t
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Onoot Boutique. Tous droits réservés.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>Paiement Sécurisé</span>
            <span>•</span>
            <span>Livraison Rapide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
