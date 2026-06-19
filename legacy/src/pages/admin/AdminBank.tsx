import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Landmark, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Check,
  ChevronsUpDown,
  Coins,
  User
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  otk_coins: number;
}

const AdminBank = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [motif, setMotif] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users for selection
  const { data: users = [] } = useQuery({
    queryKey: ["admin-bank-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, otk_coins")
        .order("username", { ascending: true });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin-bank-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("otk_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Get user info for each transaction
  const { data: transactionUsers = {} } = useQuery({
    queryKey: ["transaction-users", transactions.map(t => t.user_id)],
    queryFn: async () => {
      if (!transactions.length) return {};
      
      const userIds = [...new Set(transactions.map(t => t.user_id))];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      if (error) throw error;
      
      return data.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: transactions.length > 0,
  });

  // Transaction mutation using RPC
  const transactionMutation = useMutation({
    mutationFn: async ({ userId, amount, type, motif }: { 
      userId: string; 
      amount: number; 
      type: "credit" | "debit";
      motif: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('admin_process_transaction', {
        _admin_id: user.id,
        _target_user_id: userId,
        _amount: amount,
        _type: type,
        _reason: motif,
      });

      if (error) throw error;
      
      // Parse the JSON response
      const result = data as { success: boolean; new_balance?: number; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Transaction failed");
      }
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Transaction effectuée ! Nouveau solde: ${data.new_balance} OTK`);
      queryClient.invalidateQueries({ queryKey: ["admin-bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bank-users"] });
      // Reset form
      setSelectedUser(null);
      setAmount("");
      setMotif("");
      setTransactionType("credit");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error(error);
    },
  });

  const filteredUsers = users.filter((u) => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const motifs = [
    { value: "remboursement", label: "Remboursement" },
    { value: "bonus_staff", label: "Bonus Staff" },
    { value: "sanction", label: "Sanction" },
    { value: "correction", label: "Correction d'erreur" },
    { value: "bonus_event", label: "Bonus Événement" },
    { value: "autre", label: "Autre" },
  ];

  const handleSubmit = () => {
    if (!selectedUser || !amount || !motif) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Le montant doit être un nombre positif");
      return;
    }

    transactionMutation.mutate({
      userId: selectedUser.id,
      amount: parsedAmount,
      type: transactionType,
      motif,
    });
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0 || type.includes("credit") || type.includes("bonus") || type.includes("reward")) {
      return "text-green-500";
    }
    return "text-red-500";
  };

  const getUserInitials = (profile: UserProfile | null) => {
    if (!profile) return "?";
    const name = profile.display_name || profile.username || "";
    return name.slice(0, 2).toUpperCase() || "?";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-2">Banque Centrale OTK</h1>
        <p className="text-muted-foreground">Régulation monétaire et historique des transactions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <Card className="lg:col-span-1 p-6 bg-[#1e1e1e] border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <Landmark className="w-8 h-8 text-accent" />
            <div>
              <h2 className="font-display text-xl">Opération Bancaire</h2>
              <p className="text-sm text-muted-foreground">Crédit ou débit manuel</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* User Selector */}
            <div className="space-y-2">
              <Label>Sélectionner un membre *</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between bg-background/50"
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={selectedUser.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getUserInitials(selectedUser)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{selectedUser.username || selectedUser.display_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Rechercher...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Rechercher un pseudo..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                      <CommandGroup>
                        {filteredUsers.slice(0, 15).map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.username || u.id}
                            onSelect={() => {
                              setSelectedUser(u);
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 py-2"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                selectedUser?.id === u.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/20">
                                {getUserInitials(u)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {u.username || u.display_name || "Sans pseudo"}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                {u.otk_coins} OTK
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected User Confirmation Card */}
            {selectedUser && (
              <Card className="p-4 bg-accent/10 border-accent/30">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-accent">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-xl bg-primary/20">
                      {getUserInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg truncate">
                      {selectedUser.username || selectedUser.display_name || "Sans pseudo"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      ID: {selectedUser.id.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Coins className="w-4 h-4 text-accent" />
                      <span className="font-bold text-accent">{selectedUser.otk_coins} OTK</span>
                    </div>
                  </div>
                </div>
                {transactionType === "debit" && parseInt(amount) > selectedUser.otk_coins && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    ⚠️ Attention: Le solde est insuffisant pour ce débit
                  </p>
                )}
              </Card>
            )}

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label>Type d'opération</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={transactionType === "credit" ? "default" : "outline"}
                  className={cn(
                    "gap-2",
                    transactionType === "credit" && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => setTransactionType("credit")}
                >
                  <TrendingUp className="w-4 h-4" />
                  Crédit (+)
                </Button>
                <Button
                  type="button"
                  variant={transactionType === "debit" ? "default" : "outline"}
                  className={cn(
                    "gap-2",
                    transactionType === "debit" && "bg-red-600 hover:bg-red-700"
                  )}
                  onClick={() => setTransactionType("debit")}
                >
                  <TrendingDown className="w-4 h-4" />
                  Débit (-)
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Montant (OTK) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                min="1"
                className="bg-background/50"
              />
            </div>

            {/* Motif */}
            <div className="space-y-2">
              <Label>Motif *</Label>
              <Select value={motif} onValueChange={setMotif}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Sélectionner un motif" />
                </SelectTrigger>
                <SelectContent>
                  {motifs.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedUser && amount && (
              <div className="p-3 rounded-lg bg-background/30 border border-border/50">
                <p className="text-sm text-muted-foreground">Aperçu:</p>
                <p className="font-mono text-lg">
                  {selectedUser.otk_coins} {transactionType === "credit" ? "+" : "-"} {amount} = {" "}
                  <span className={transactionType === "credit" ? "text-green-400" : "text-red-400"}>
                    {transactionType === "credit" 
                      ? selectedUser.otk_coins + parseInt(amount || "0")
                      : Math.max(0, selectedUser.otk_coins - parseInt(amount || "0"))
                    } OTK
                  </span>
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={transactionMutation.isPending || !selectedUser || !amount || !motif}
              className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {transactionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Exécuter la transaction
            </Button>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="lg:col-span-2 p-6 bg-[#1e1e1e] border-border/50">
          <h2 className="font-display text-xl mb-4">Historique des opérations</h2>
          
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sakura" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Membre</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-right text-muted-foreground">Montant</TableHead>
                    <TableHead className="text-muted-foreground">Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const txUser = transactionUsers[tx.user_id];
                    return (
                      <TableRow key={tx.id} className="border-border/30 hover:bg-white/5">
                        <TableCell className="text-sm text-muted-foreground">
                          {format(parseISO(tx.created_at), "dd/MM/yy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={txUser?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {(txUser?.username || txUser?.display_name || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {txUser?.username || txUser?.display_name || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              tx.amount > 0 ? "border-green-500/50 text-green-500" : "border-red-500/50 text-red-500"
                            )}
                          >
                            {tx.amount > 0 ? (
                              <ArrowUpCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowDownCircle className="w-3 h-3 mr-1" />
                            )}
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-bold",
                          getTransactionColor(tx.transaction_type, tx.amount)
                        )}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {tx.description || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminBank;