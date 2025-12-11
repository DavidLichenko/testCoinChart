"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, User, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";

interface FavoriteClient {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string | null;
    email: string;
    baseCurrency: string;
    walletBalances?: Array<{
      assetSymbol: string;
      ownBalance: number;
    }>;
  };
  createdAt: string;
}

export function FavoriteClientsWindow() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 100 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({ x: window.innerWidth - 320, y: 100 });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/favorite-clients`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorite clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (clientId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${clientId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: false }),
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.clientId !== clientId));
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  if (!user || favorites.length === 0) return null;

  return (
    <motion.div
      className="fixed z-50"
      style={{
        x: position.x,
        y: position.y,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      style={{ willChange: "transform" }}
      onDragEnd={(_, info) => {
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y,
        });
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="w-80 bg-slate-950/95 backdrop-blur-sm border-slate-800 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              Favorite Clients
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? "+" : "-"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                  </div>
                ) : favorites.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No favorite clients
                  </p>
                ) : (
                  favorites.map((favorite) => {
                    const wallet = favorite.client.walletBalances?.find(
                      (w) => w.assetSymbol === favorite.client.baseCurrency
                    );
                    const balance = wallet?.ownBalance || 0;

                    return (
                      <motion.div
                        key={favorite.id}
                        whileHover={{ scale: 1.02 }}
                        className="group rounded-lg border border-slate-800 bg-slate-900/50 p-3 hover:bg-slate-900 transition cursor-pointer"
                        onClick={() => router.push(`/admin/users/${favorite.clientId}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <p className="text-xs font-medium text-white truncate">
                                {favorite.client.name || favorite.client.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                              <p className="text-[10px] text-slate-400 truncate">
                                {favorite.client.email}
                              </p>
                            </div>
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              >
                                {balance.toFixed(2)} {favorite.client.baseCurrency}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFavorite(favorite.clientId);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-slate-400 hover:text-red-400" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

