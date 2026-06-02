import { Loader2, Unlink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const DetachEventDialog = ({
  open,
  onOpenChange,
  eventTitle,
  onConfirm,
  isSubmitting,
}: Props) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-[#0D0D0D] border-mp-border">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-slate-50">
          Détacher cet événement ?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-mp-ink-muted">
          L'événement <strong className="text-slate-200">"{eventTitle}"</strong> ne
          sera plus rattaché à l'association. Il restera visible dans l'agenda
          global en tant qu'événement Manga Paradise.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isSubmitting} className="border-slate-600 text-slate-200">
          Annuler
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
          disabled={isSubmitting}
          className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Unlink className="h-4 w-4 mr-2" />
          )}
          Détacher
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DetachEventDialog;
