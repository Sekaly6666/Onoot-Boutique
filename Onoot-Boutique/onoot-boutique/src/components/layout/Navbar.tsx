import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ShoppingCart, User, Menu, Search, LogOut, Package, ShieldCheck, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OnootLogo } from "@/components/ui/OnootLogo";

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCartContext();
  const { isDark, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart?.totalItems || 0;
  const isAuthPage = location.startsWith('/auth');
  const logoVariant = isDark ? 'white' : 'color';

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setLocation(`/products?search=${encodeURIComponent(value.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white dark:bg-gray-950 text-foreground dark:text-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link
          href="/"
          aria-label="Accueil Onoot Boutique"
          className="flex shrink-0 items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87C2A] focus-visible:ring-offset-2"
        >
          <OnootLogo size="md" variant={logoVariant} />
        </Link>

        {!isAuthPage && (
          <div className="flex-1 max-w-xl hidden md:flex relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchValue}
              placeholder="Rechercher un produit..."
              className="flex h-9 w-full rounded-full border border-input bg-gray-50 dark:bg-gray-800 px-3 py-1 text-sm shadow-inner transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E87C2A] pl-9 pr-4 dark:text-white"
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(e.currentTarget.value);
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
          </Button>

          {!isAuthPage && (
            <Button variant="ghost" size="icon" className="relative cursor-pointer" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E87C2A] text-[10px] font-bold text-white">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-offset-2 hover:ring-2 hover:ring-primary/20 transition-all">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold overflow-hidden border border-primary/20">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-2xl rounded-2xl p-1.5" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-2.5 pb-2 bg-slate-50 dark:bg-gray-800/50 rounded-xl mb-1">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="mr-2.5 h-4 w-4 text-slate-500 dark:text-gray-400" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/orders")}>
                  <Package className="mr-2.5 h-4 w-4 text-slate-500 dark:text-gray-400" />
                  <span>Mes Commandes</span>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    <ShieldCheck className="mr-2.5 h-4 w-4 text-[#E87C2A]" />
                    <span className="text-[#E87C2A] font-semibold">Administration</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" onClick={() => setLocation("/auth/login")}>Connexion</Button>
              <Button
                className="bg-[#E87C2A] hover:bg-[#D06820] text-white"
                onClick={() => setLocation("/auth/register")}
              >
                S'inscrire
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Barre de recherche mobile TOUJOURS visible sur téléphone */}
      {!isAuthPage && (
        <div className="md:hidden px-4 pb-2.5 pt-0.5 bg-white dark:bg-gray-950">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchValue}
              placeholder="Rechercher un produit..."
              className="flex h-10 w-full rounded-full border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E87C2A] pl-10 pr-4 dark:text-white"
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(e.currentTarget.value);
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white dark:bg-gray-950 px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {/* Search input for mobile */}
          {!isAuthPage && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={searchValue}
                placeholder="Rechercher un produit..."
                className="flex h-10 w-full rounded-full border border-input bg-gray-50 dark:bg-gray-800 px-3 py-1 text-sm pl-9 pr-4 dark:text-white"
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(e.currentTarget.value);
                }} 
              />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1 pt-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Tous les produits
            </Link>
            <Link
              href="/products?onSale=true"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              <span>Promotions & Ventes Flash</span>
              <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold px-2 py-0.5 rounded-full">
                Promo
              </span>
            </Link>

            {user && (
              <>
                <div className="h-px bg-border my-2" />
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Package className="w-4 h-4 text-primary" />
                  <span>Mes Commandes</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>Mon Profil ({user.name})</span>
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#E87C2A] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Espace Administration</span>
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left w-full mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            )}
          </nav>

          {/* Auth buttons when not logged in */}
          {!user && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button 
                variant="outline" 
                className="flex-1 h-10 font-medium" 
                onClick={() => { setLocation("/auth/login"); setMobileMenuOpen(false); }}
              >
                Connexion
              </Button>
              <Button
                className="flex-1 h-10 bg-[#E87C2A] hover:bg-[#D06820] text-white font-medium shadow-sm"
                onClick={() => { setLocation("/auth/register"); setMobileMenuOpen(false); }}
              >
                S'inscrire
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}