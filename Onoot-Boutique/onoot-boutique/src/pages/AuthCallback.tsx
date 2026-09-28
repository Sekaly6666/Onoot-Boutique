import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Page de callback après authentification Google.
 * Google redirige vers /auth/callback?token=xxx
 * On lit le token, on fetch le user et on connecte.
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      const messages: Record<string, string> = {
        google_cancelled: "Connexion Google annulée.",
        google_failed: "Échec de la connexion Google. Réessayez.",
      };
      toast({
        title: "Erreur",
        description: messages[error] || "Une erreur est survenue.",
        variant: "destructive",
      });
      setLocation("/auth/login");
      return;
    }

    if (!token) {
      setLocation("/auth/login");
      return;
    }

    // Fetch user info with the token
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Token invalide");
        return res.json();
      })
      .then((user) => {
        login(token, user);
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${user.firstName || user.name || ""}!`,
        });
        setLocation("/");
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer votre compte.",
          variant: "destructive",
        });
        setLocation("/auth/login");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
          Connexion en cours…
        </p>
      </div>
    </div>
  );
}
