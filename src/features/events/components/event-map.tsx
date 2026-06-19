"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { eventCoords, type EventRow } from "@/features/events/lib";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return "&quot;";
    }
  });
}

/** Carte Leaflet (client-only, chargée dynamiquement). Marqueurs = événements géolocalisés. */
export function EventMap({ events }: { events: EventRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const points = events
      .map((e) => ({ e, c: eventCoords(e) }))
      .filter(
        (x): x is { e: EventRow; c: { lat: number; lng: number } } =>
          x.c !== null,
      );

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current).setView(
        points[0] ? [points[0].c.lat, points[0].c.lng] : [46.6, 2.4],
        points[0] ? 6 : 5,
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      for (const { e, c } of points) {
        L.circleMarker([c.lat, c.lng], {
          radius: 9,
          weight: 2,
          color: "#DC1E44",
          fillColor: "#DC1E44",
          fillOpacity: 0.7,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${escapeHtml(e.title)}</strong>${
              e.city ? "<br/>" + escapeHtml(e.city) : ""
            }`,
          );
      }

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points.map((p) => [p.c.lat, p.c.lng])), {
          padding: [40, 40],
        });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [events]);

  return (
    <div
      ref={containerRef}
      className="border-border h-[480px] w-full overflow-hidden rounded-xl border"
    />
  );
}
