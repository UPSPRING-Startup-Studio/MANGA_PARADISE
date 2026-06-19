import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Loader2, 
  Edit,
  Trash2,
  Coins,
  Package,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { shopCategories, getTypeLabel } from "@/hooks/useShopItems";

const AdminShop = () => {
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState<{ open: boolean; item: any }>({ open: false, item: null });
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "goodies",
    type: "DIGITAL",
    image_url: "",
    stock: "",
    is_available: true,
    tags: "",
  });

  // Fetch items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-shop-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        price: parseInt(data.price),
        category: data.category,
        type: data.type,
        image_url: data.image_url || null,
        stock: data.stock ? parseInt(data.stock) : null,
        is_available: data.is_available,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
      };

      if (data.id) {
        const { error } = await supabase
          .from("shop_items")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shop_items")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editModal.item ? "Article mis à jour !" : "Article créé !");
      queryClient.invalidateQueries({ queryKey: ["admin-shop-items"] });
      setEditModal({ open: false, item: null });
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    },
  });

  // Toggle availability mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from("shop_items")
        .update({ is_available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shop-items"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("shop_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-shop-items"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "goodies",
      type: "DIGITAL",
      image_url: "",
      stock: "",
      is_available: true,
      tags: "",
    });
  };

  const openEditModal = (item?: any) => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category: item.category,
        type: item.type,
        image_url: item.image_url || "",
        stock: item.stock?.toString() || "",
        is_available: item.is_available,
        tags: item.tags?.join(", ") || "",
      });
    } else {
      resetForm();
    }
    setEditModal({ open: true, item });
  };

  const types = [
    { value: "DIGITAL", label: "Digital" },
    { value: "PHYSICAL", label: "Physique" },
    { value: "SERVICE", label: "Service" },
    { value: "PARTNER", label: "Partenaire" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-2">Gestion de la Boutique</h1>
          <p className="text-muted-foreground">Le Bazar d'Akihabara</p>
        </div>
        <Button onClick={() => openEditModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-sakura" />
            <div>
              <p className="text-2xl font-display">{items.length}</p>
              <p className="text-sm text-muted-foreground">Articles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Coins className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-display">
                {items.filter((i) => i.is_available).length}
              </p>
              <p className="text-sm text-muted-foreground">En stock</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-display">
                {items.filter((i) => !i.is_available).length}
              </p>
              <p className="text-sm text-muted-foreground">Rupture</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sakura" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const typeInfo = getTypeLabel(item.type);
            return (
              <Card key={item.id} className="overflow-hidden hover:border-sakura/50 transition-colors">
                <div className="aspect-square bg-muted relative">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {typeInfo.emoji}
                    </div>
                  )}
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="destructive">Rupture de stock</Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">{item.name}</h3>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {item.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-accent text-lg">{item.price} OTK</span>
                    {item.stock !== null && (
                      <span className="text-xs text-muted-foreground">
                        Stock: {item.stock}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, is_available: v })}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.is_available ? "En stock" : "Rupture"}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModal.open} onOpenChange={(open) => setEditModal({ open, item: editModal.item })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editModal.item ? "Modifier l'article" : "Ajouter un article"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de l'article"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix (OTK) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Illimité"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shopCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL de l'image</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (séparés par virgules)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="manga, collector, édition limitée"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Disponible à la vente</p>
                <p className="text-xs text-muted-foreground">L'article sera visible dans la boutique</p>
              </div>
              <Switch
                checked={formData.is_available}
                onCheckedChange={(v) => setFormData({ ...formData, is_available: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal({ open: false, item: null })}>
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate({ ...formData, id: editModal.item?.id })}
              disabled={saveMutation.isPending || !formData.name || !formData.price}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editModal.item ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShop;
