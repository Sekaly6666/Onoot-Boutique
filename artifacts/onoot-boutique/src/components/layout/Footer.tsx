import React from "react";
import { Link } from "wouter";
import { Package, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white p-1 rounded-lg">
                <Package size={20} />
              </div>
              <span className="font-bold text-xl text-white">Onoot Boutique</span>
            </div>
            <p className="text-sm text-gray-400">
              Votre destination premium pour les accessoires tech en Afrique. Qualité, rapidité et confiance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Catalogue</Link></li>
              <li><Link href="/products?category=smartwatches" className="hover:text-primary transition-colors">Montres Connectées</Link></li>
              <li><Link href="/products?category=earphones" className="hover:text-primary transition-colors">Écouteurs</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Mon Compte</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Service Client</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Contactez-nous</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Livraison & Retours</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Conditions générales</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-primary" />
                <span>Plateau, Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-primary" />
                <span>+225 01 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-primary" />
                <span>contact@onoot.com</span>
              </li>
            </ul>
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
