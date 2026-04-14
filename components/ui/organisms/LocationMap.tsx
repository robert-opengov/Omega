'use client';

import { useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms';
import { Locate, AlertCircle } from 'lucide-react';
import type { IMapAdapter, MapMarker, MapOptions } from '@/lib/core/ports/map.port';

export interface LocationMapProps {
  adapter: IMapAdapter;
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  selectedMarker?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  showGeolocation?: boolean;
  boundaryGeoJson?: string;
  height?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Provider-agnostic map component. Delegates all map operations to an
 * `IMapAdapter` passed via props — the component never imports a map
 * library directly.
 *
 * @example
 * const adapter = useMemo(() => new LeafletAdapter(), []);
 * <LocationMap adapter={adapter} center={[40.7, -74]} markers={pins} />
 */
export function LocationMap({
  adapter,
  center = [39.8283, -98.5795],
  zoom = 4,
  markers = [],
  selectedMarker,
  onMarkerClick,
  onMapClick,
  interactive = true,
  showGeolocation = true,
  boundaryGeoJson,
  height = '400px',
  className,
  ariaLabel = 'Interactive map',
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const options: MapOptions = { center, zoom, interactive };
    adapter.initialize(containerRef.current, options);

    if (onMapClick) {
      adapter.onMapClick((lat, lng) => onMapClick(lat, lng));
    }

    if (onMarkerClick) {
      adapter.onMarkerClick((markerId) => {
        const marker = markers.find((m) => m.id === markerId);
        if (marker) onMarkerClick(marker);
      });
    }

    return () => {
      adapter.destroy();
      initializedRef.current = false;
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter]);

  useEffect(() => {
    if (!initializedRef.current) return;
    adapter.setCenter(center[0], center[1]);
  }, [adapter, center]);

  useEffect(() => {
    if (!initializedRef.current) return;
    adapter.setZoom(zoom);
  }, [adapter, zoom]);

  useEffect(() => {
    if (!initializedRef.current) return;
    adapter.clearMarkers();
    markers.forEach((m) => adapter.addMarker(m));
  }, [adapter, markers]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (boundaryGeoJson) {
      adapter.setBoundary(boundaryGeoJson);
    } else {
      adapter.clearBoundary();
    }
  }, [adapter, boundaryGeoJson]);

  const handleGeolocate = useCallback(async () => {
    try {
      setGeoError(null);
      const pos = await adapter.geolocate();
      adapter.setCenter(pos.lat, pos.lng);
      adapter.setZoom(15);
    } catch {
      setGeoError('Unable to determine your location');
    }
  }, [adapter]);

  return (
    <div className={cn('relative rounded border border-border overflow-hidden', className)} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" role="application" aria-label={ariaLabel} />

      {showGeolocation && interactive && (
        <div className="absolute bottom-3 right-3 z-content">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeolocate}
            aria-label="Find my location"
            className="bg-card shadow-sm"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      )}

      {geoError && (
        <div className="absolute bottom-14 right-3 z-content flex items-center gap-1.5 bg-card border border-destructive rounded px-2 py-1 text-xs text-destructive shadow-sm">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {geoError}
        </div>
      )}
    </div>
  );
}

export default LocationMap;
