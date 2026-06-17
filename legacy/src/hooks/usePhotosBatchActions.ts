import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  toi: "TOI",
  original: "ORIGINAL",
  wip: "WIP",
  shooting: "SHOOTING",
  detail: "DÉTAIL",
};

function invalidatePhotos(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["cosplay-photos"] });
  qc.invalidateQueries({ queryKey: ["all-cosplay-photos"] });
  qc.invalidateQueries({ queryKey: ["event-photos"] });
}

// ── Snapshot type for undo ────────────────────────────────────────────────────

interface PhotoSnapshot {
  id: string;
  event_id: string | null;
  event_name_manual: string | null;
  event_date_manual: string | null;
  event_location_manual: string | null;
  activity_id: string | null;
}

export interface UndoState {
  type: "associate" | "remove";
  label: string;
  snapshots: PhotoSnapshot[];
}

// ── Helper: fetch current event fields for a set of photo ids ────────────────

async function snapshotPhotos(photoIds: string[]): Promise<PhotoSnapshot[]> {
  if (photoIds.length === 0) return [];

  const { data, error } = await (supabase as any)
    .from("cosplay_photos")
    .select("id, event_id, event_name_manual, event_date_manual, event_location_manual, activity_id")
    .in("id", photoIds);

  if (error) throw error;
  return (data ?? []) as PhotoSnapshot[];
}

// ── Helper: restore photos from snapshots ────────────────────────────────────

async function restoreFromSnapshots(snapshots: PhotoSnapshot[]) {
  // Group by identical state to minimise queries
  const groups = new Map<string, { ids: string[]; update: Record<string, unknown> }>();
  for (const snap of snapshots) {
    const key = JSON.stringify({
      event_id: snap.event_id,
      event_name_manual: snap.event_name_manual,
      event_date_manual: snap.event_date_manual,
      event_location_manual: snap.event_location_manual,
      activity_id: snap.activity_id,
    });
    const group = groups.get(key);
    if (group) {
      group.ids.push(snap.id);
    } else {
      groups.set(key, {
        ids: [snap.id],
        update: {
          event_id: snap.event_id,
          event_name_manual: snap.event_name_manual,
          event_date_manual: snap.event_date_manual,
          event_location_manual: snap.event_location_manual,
          activity_id: snap.activity_id,
        },
      });
    }
  }

  for (const { ids, update } of groups.values()) {
    const { error } = await (supabase as any)
      .from("cosplay_photos")
      .update(update)
      .in("id", ids);

    if (error) {
      // Retry without activity_id if column doesn't exist
      if (error.message?.includes("activity_id")) {
        const { activity_id: _, ...safe } = update;
        const { error: retryErr } = await (supabase as any)
          .from("cosplay_photos")
          .update(safe)
          .in("id", ids);
        if (retryErr) throw retryErr;
      } else {
        throw error;
      }
    }
  }
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function usePhotosBatchActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Undo state ──────────────────────────────────────────────────────────
  const [lastAction, setLastAction] = useState<UndoState | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndo = useCallback(() => {
    setLastAction(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const scheduleUndoExpiry = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setLastAction(null);
      undoTimerRef.current = null;
    }, 30_000); // 30s window to undo
  }, []);

  // ── Undo mutation ───────────────────────────────────────────────────────

  const undoMutation = useMutation({
    mutationFn: async (undo: UndoState) => {
      await restoreFromSnapshots(undo.snapshots);
      return undo.snapshots.length;
    },
    onSuccess: (count) => {
      invalidatePhotos(queryClient);
      clearUndo();
      toast({ title: `Annulation effectuée — ${count} photo${count > 1 ? "s" : ""} restaurée${count > 1 ? "s" : ""}` });
    },
    onError: (err) => {
      console.error("Undo error:", err);
      toast({ title: "Erreur", description: "Impossible d'annuler l'action.", variant: "destructive" });
    },
  });

  const undo = useCallback(() => {
    if (lastAction) undoMutation.mutate(lastAction);
  }, [lastAction, undoMutation]);

  // ── Delete (no undo for deletes — irreversible) ─────────────────────────

  const deleteMany = useMutation({
    mutationFn: async (photoIds: string[]) => {
      if (photoIds.length === 0) return 0;
      clearUndo();

      await (supabase as any)
        .from("cosplay_photo_tags")
        .delete()
        .in("photo_id", photoIds)
        .then(() => {});

      const { error } = await (supabase as any)
        .from("cosplay_photos")
        .delete()
        .in("id", photoIds);
      if (error) throw error;

      return photoIds.length;
    },
    onSuccess: (count) => {
      invalidatePhotos(queryClient);
      toast({ title: `${count} photo${count > 1 ? "s" : ""} supprimée${count > 1 ? "s" : ""}` });
    },
    onError: (err) => {
      console.error("Batch delete error:", err);
      toast({ title: "Erreur", description: "Impossible de supprimer les photos.", variant: "destructive" });
    },
  });

  // ── Update type ─────────────────────────────────────────────────────────

  const updateType = useMutation({
    mutationFn: async ({ photoIds, newType }: { photoIds: string[]; newType: string }) => {
      if (photoIds.length === 0) return { count: 0, type: newType };

      const { error } = await (supabase as any)
        .from("cosplay_photos")
        .update({ photo_type: newType })
        .in("id", photoIds);
      if (error) throw error;
      return { count: photoIds.length, type: newType };
    },
    onSuccess: ({ count, type }) => {
      if (count === 0) return;
      invalidatePhotos(queryClient);
      toast({ title: `${count} photo${count > 1 ? "s" : ""} → ${TYPE_LABELS[type] || type}` });
    },
    onError: (err) => {
      console.error("Batch updateType error:", err);
      toast({ title: "Erreur", description: "Impossible de modifier le type.", variant: "destructive" });
    },
  });

  // ── Associate event (with undo snapshot) ────────────────────────────────

  const associateEvent = useMutation({
    mutationFn: async ({
      photoIds,
      eventId,
      eventName,
      eventLabel,
    }: {
      photoIds: string[];
      eventId?: string;
      eventName?: string;
      eventLabel?: string;
    }) => {
      if (photoIds.length === 0) return 0;

      // 1. Snapshot before mutation
      const snapshots = await snapshotPhotos(photoIds);

      // 2. Apply mutation
      const updateData: Record<string, unknown> = {};
      if (eventId) {
        updateData.event_id = eventId;
      } else if (eventName) {
        updateData.event_name_manual = eventName;
      }

      const { error } = await (supabase as any)
        .from("cosplay_photos")
        .update(updateData)
        .in("id", photoIds);
      if (error) throw error;

      // 3. Store undo state
      return { count: photoIds.length, snapshots, eventLabel: eventLabel ?? eventName ?? "événement" };
    },
    onSuccess: (result) => {
      if (!result || result.count === 0) return;
      invalidatePhotos(queryClient);

      const undoState: UndoState = {
        type: "associate",
        label: result.eventLabel,
        snapshots: result.snapshots,
      };
      setLastAction(undoState);
      scheduleUndoExpiry();

      toast({
        title: `${result.count} photo${result.count > 1 ? "s" : ""} associée${result.count > 1 ? "s" : ""} à « ${result.eventLabel} »`,
        description: "Vous pouvez annuler cette action pendant 30 secondes.",
      });
    },
    onError: (err) => {
      console.error("Batch associateEvent error:", err);
      toast({ title: "Erreur", description: "Impossible d'associer l'événement.", variant: "destructive" });
    },
  });

  // ── Remove event (with undo snapshot) ───────────────────────────────────

  const removeEvent = useMutation({
    mutationFn: async (photoIds: string[]) => {
      if (photoIds.length === 0) return { count: 0, snapshots: [] as PhotoSnapshot[] };

      // 1. Snapshot before mutation
      const snapshots = await snapshotPhotos(photoIds);

      // 2. Apply mutation
      const updateData: Record<string, unknown> = {
        event_id: null,
        event_name_manual: null,
        event_date_manual: null,
        event_location_manual: null,
        activity_id: null,
      };

      const { error } = await (supabase as any)
        .from("cosplay_photos")
        .update(updateData)
        .in("id", photoIds);

      if (error) {
        if (error.message?.includes("activity_id")) {
          const { activity_id: _, ...safe } = updateData;
          const { error: retryErr } = await (supabase as any)
            .from("cosplay_photos")
            .update(safe)
            .in("id", photoIds);
          if (retryErr) throw retryErr;
        } else {
          throw error;
        }
      }

      return { count: photoIds.length, snapshots };
    },
    onSuccess: ({ count, snapshots }) => {
      if (count === 0) return;
      invalidatePhotos(queryClient);

      const undoState: UndoState = {
        type: "remove",
        label: "Retrait d'événement",
        snapshots,
      };
      setLastAction(undoState);
      scheduleUndoExpiry();

      toast({
        title: `Événement retiré de ${count} photo${count > 1 ? "s" : ""}`,
        description: "Vous pouvez annuler cette action pendant 30 secondes.",
      });
    },
    onError: (err) => {
      console.error("Batch removeEvent error:", err);
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  return {
    deleteMany,
    updateType,
    associateEvent,
    removeEvent,
    // Undo
    lastAction,
    undo,
    clearUndo,
    isUndoing: undoMutation.isPending,
  };
}
