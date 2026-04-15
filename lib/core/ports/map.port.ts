/* -------------------------------------------------------------------
 * Map Adapter Port
 * Provider-agnostic map interface — allows swapping between Leaflet,
 * Esri ArcGIS, Google Maps, Mapbox, etc.
 * ----------------------------------------------------------------- */

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapOptions {
  center: [number, number];
  zoom: number;
  interactive?: boolean;
}

export interface IMapAdapter {
  initialize(container: HTMLDivElement, options: MapOptions): void;
  setCenter(lat: number, lng: number): void;
  setZoom(zoom: number): void;
  addMarker(marker: MapMarker): void;
  removeMarker(id: string): void;
  updateMarker(marker: MapMarker): void;
  clearMarkers(): void;
  setBoundary(geoJson: string): void;
  clearBoundary(): void;
  fitBounds(bounds: MapBounds): void;
  onMapClick(handler: (lat: number, lng: number) => void): void;
  onMarkerClick(handler: (markerId: string) => void): void;
  highlightMarker?(id: string | null): void;
  geolocate(): Promise<{ lat: number; lng: number }>;
  destroy(): void;
}
