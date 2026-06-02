import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSOCIATION_ROLE_LABELS, type AssociationRole } from "@/hooks/useAssociation";

export type SortKey = "recent" | "oldest" | "name_asc" | "name_desc" | "role";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Plus récent",
  oldest: "Plus ancien",
  name_asc: "Nom A-Z",
  name_desc: "Nom Z-A",
  role: "Rôle",
};

const ALL_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "secretaire",
  "tresorier",
  "responsable",
  "benevole",
  "membre",
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  roleFilter: string;
  onRoleFilterChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
}

const AssociationMembersFilters = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  sort,
  onSortChange,
}: Props) => (
  <div className="flex flex-col sm:flex-row gap-3">
    {/* Search */}
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher un membre..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 bg-[#111827]/60 border-border/50 focus-visible:border-[#E84A2B]/50"
      />
    </div>

    {/* Role filter */}
    <Select value={roleFilter} onValueChange={onRoleFilterChange}>
      <SelectTrigger className="w-full sm:w-44 bg-[#111827]/60 border-border/50">
        <SelectValue placeholder="Tous les rôles" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les rôles</SelectItem>
        {ALL_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ASSOCIATION_ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Sort */}
    <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
      <SelectTrigger className="w-full sm:w-40 bg-[#111827]/60 border-border/50">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default AssociationMembersFilters;
