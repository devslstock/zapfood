"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

// Geocodifica com Nominatim (OpenStreetMap, gratuito e sem chave de API) e
// mostra um mapa Leaflet com pino arrastável — o cliente confirma o ponto
// exato antes de finalizar o pedido. Leaflet só é importado dentro de
// useEffect (client-only) porque toca `window` no carregamento do módulo,
// o que quebraria a renderização no servidor se importado no topo do arquivo.
export function AddressMap({
  query,
  lat,
  lng,
  onConfirm,
  onDirty,
}: {
  query: string;
  lat: number | null;
  lng: number | null;
  onConfirm: (lat: number, lng: number) => void;
  onDirty?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    lat && lng ? "ready" : "idle"
  );
  const [confirmed, setConfirmed] = useState(!!(lat && lng));
  const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );

  const onDirtyRef = useRef(onDirty);
  useEffect(() => {
    onDirtyRef.current = onDirty;
  });

  useEffect(() => {
    if (!query || query.trim().length < 8) return;

    const timeout = setTimeout(async () => {
      setStatus("loading");
      setConfirmed(false);
      onDirtyRef.current?.();
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`
        );
        const results = await response.json();
        if (results?.[0]) {
          setPinPosition({ lat: Number(results[0].lat), lng: Number(results[0].lon) });
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!pinPosition || !containerRef.current) return;
    let cancelled = false;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current) return;
      const L = leafletModule.default;

      const pinIcon = L.divIcon({
        className: "",
        html: '<div style="font-size:32px;line-height:1;transform:translate(-50%,-90%)">📍</div>',
        iconSize: [0, 0],
      });

      if (!mapRef.current) {
        const map = L.map(containerRef.current).setView([pinPosition.lat, pinPosition.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([pinPosition.lat, pinPosition.lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setPinPosition({ lat: pos.lat, lng: pos.lng });
          setConfirmed(false);
          onDirty?.();
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        mapRef.current.setView([pinPosition.lat, pinPosition.lng], 16);
        markerRef.current?.setLatLng([pinPosition.lat, pinPosition.lng]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pinPosition]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (status === "idle") return null;

  return (
    <div className="mt-2">
      {status === "loading" && !pinPosition && (
        <p className="text-xs text-zinc-500">Localizando endereço no mapa...</p>
      )}
      {status === "error" && !pinPosition && (
        <p className="text-xs text-amber-600">
          Não encontramos esse endereço no mapa — confira o CEP e o número.
        </p>
      )}
      {pinPosition && (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div ref={containerRef} className="h-48 w-full" />
          <div className="flex items-center justify-between gap-2 bg-zinc-50 px-3 py-2">
            <p className="text-xs text-zinc-500">
              {confirmed ? "Localização confirmada ✓" : "Arraste o pino se precisar ajustar"}
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirmed(true);
                onConfirm(pinPosition.lat, pinPosition.lng);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white ${
                confirmed ? "bg-emerald-600" : "bg-brand hover:bg-brand-dark"
              }`}
            >
              {confirmed ? "Confirmado" : "Confirmar localização"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
