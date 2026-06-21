import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { ShoppingCart, User, Menu, Search, LogOut, Package, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import onootLogo from "/onoot-logo.png";

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCartContext();
  const [location, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart?.totalItems || 0;

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link href="/">
          <div className="flex items-center cursor-pointer shrink-0">
            <img src={onootLogo} alt="Onoot Boutique" className="h-12 w-auto object-contain" />
          </div>
        </Link>

        <div className="flex-1 max-w-xl hidden md:flex relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={searchValue}
            placeholder="Rechercher un produit..."
            className="flex h-9 w-full rounded-full border border-input bg-gray-50 px-3 py-1 text-sm shadow-inner transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DB649] pl-9 pr-4"
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(e.currentTarget.value);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative cursor-pointer">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E87C2A] text-[10px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3DB649]/10 text-[#3DB649]">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/orders")}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Mes Commandes</span>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-[#3DB649]" />
                    <span className="text-[#3DB649] font-medium">Administration</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" onClick={() => setLocation("/auth/login")}>Connexion</Button>
              <Button className="bg-[#3DB649] hover:bg-[#2ea03a] text-white" onClick={() => setLocation("/auth/register")}>S'inscrire</Button>
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

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher un produit..."
              className="flex h-9 w-full rounded-full border border-input bg-gray-50 px-3 py-1 text-sm pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(e.currentTarget.value);
              }}
            />
          </div>
          {!user && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setLocation("/auth/login"); setMobileMenuOpen(false); }}>Connexion</Button>
              <Button className="flex-1 bg-[#3DB649] hover:bg-[#2ea03a] text-white" onClick={() => { setLocation("/auth/register"); setMobileMenuOpen(false); }}>S'inscrire</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
