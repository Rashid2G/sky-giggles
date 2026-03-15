"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Plane, Crosshair, MapPin } from "lucide-react";
import L from "leaflet";

// Fix for default Leaflet markers in Next.js
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Type declarations
interface FlightData {
  icao24: string;
  callsign: string;
  origin_country: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  vertical_rate: number;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

declare module "leaflet" {
  export const markerIconDefault: any;
}

// Fix Leaflet icons
// @ts-ignore - Leaflet internal property
if (L.Icon.Default.prototype._getIconUrl) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Clear airplane SVG icon
const airplaneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
</svg>
`;

// Create airplane icon with rotation based on heading
const createAirplaneIcon = (heading: number = 0) => {
  return L.divIcon({
    className: "custom-airplane-marker",
    html: `
      <div class="airplane-container" style="transform: rotate(${heading}deg);">
        <div class="airplane-icon-wrapper">
          ${airplaneSvg}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface FlightMapProps {
  originLat: number;
  originLon: number;
}

// Component to track map bounds and trigger refetches
function MapBoundsTracker({ 
  onBoundsChange, 
  onMapReady 
}: { 
  onBoundsChange: (bounds: Bounds) => void;
  onMapReady: () => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady();
  }, [onMapReady]);

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast(),
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast(),
      });
    },
  });

  return null;
}

export default function FlightMap({ originLat, originLon }: FlightMapProps) {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch flights within the current bounding box
  const fetchFlights = useCallback(async (currentBounds: Bounds) => {
    try {
      setLoading(true);
      
      // Add a small buffer to ensure we get planes just outside view
      const bufferLat = (currentBounds.maxLat - currentBounds.minLat) * 0.1;
      const bufferLon = (currentBounds.maxLon - currentBounds.minLon) * 0.1;

      const response = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${currentBounds.minLat - bufferLat}&lamax=${currentBounds.maxLat + bufferLat}&lomin=${currentBounds.minLon - bufferLon}&lomax=${currentBounds.maxLon + bufferLon}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch flight data");
      }

      const data = await response.json();
      
      if (data.states) {
        const parsedFlights: FlightData[] = data.states
          .filter((state: any) => state[6] !== null && state[5] !== null) // Only flights with position data
          .map((state: any) => ({
            icao24: state[0],
            callsign: state[1]?.trim() || "Unknown",
            origin_country: state[2],
            longitude: state[5],
            latitude: state[6],
            altitude: state[7],
            velocity: state[9],
            heading: state[10] || 0,
            vertical_rate: state[11],
          }));

        setFlights(parsedFlights);
        setError(null);
      } else {
        setFlights([]);
      }
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError("Couldn't reach the sky... probably too cloudy");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle bounds change from map
  const handleBoundsChange = useCallback((newBounds: Bounds) => {
    setBounds(newBounds);
    fetchFlights(newBounds);
  }, [fetchFlights]);

  // Initial fetch when map is ready
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Set up interval for auto-refresh
  useEffect(() => {
    if (!mapReady || !bounds) return;

    // Initial fetch
    fetchFlights(bounds);

    // Update every 15 seconds
    intervalRef.current = setInterval(() => {
      if (bounds) {
        fetchFlights(bounds);
      }
    }, 15000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mapReady, bounds, fetchFlights]);

  const defaultCenter: [number, number] = [originLat, originLon];

  if (loading && flights.length === 0 && !mapReady) {
    return (
      <div className="w-full h-[600px] bg-slate-100 flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-xl">
        <Plane className="w-16 h-16 text-slate-400 animate-bounce" />
        <p className="mt-4 text-slate-600 font-medium">Scanning the skies...</p>
        <p className="text-sm text-slate-400">Talking to OpenSky satellites</p>
      </div>
    );
  }

  if (error && flights.length === 0) {
    return (
      <div className="w-full h-[600px] bg-red-50 flex flex-col items-center justify-center border-4 border-dashed border-red-200 rounded-xl">
        <div className="text-red-500 text-6xl">🛩️</div>
        <p className="mt-4 text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => bounds && fetchFlights(bounds)}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-xl border-2 border-slate-200">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <MapBoundsTracker onBoundsChange={handleBoundsChange} onMapReady={handleMapReady} />
          
          {/* User location marker */}
          <Marker position={defaultCenter}>
            <Popup>
              <div className="text-center">
                <MapPin className="w-6 h-6 mx-auto text-rose-500" />
                <p className="font-bold mt-1">Your estimated location</p>
                <p className="text-sm text-slate-600">{originLat.toFixed(2)}, {originLon.toFixed(2)}</p>
              </div>
            </Popup>
          </Marker>

          {/* Flight markers */}
          {flights.map((flight) => (
            <Marker
              key={flight.icao24}
              position={[flight.latitude, flight.longitude]}
              icon={createAirplaneIcon(flight.heading)}
              eventHandlers={{
                click: () => setSelectedFlight(flight),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-lg">{flight.callsign}</span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><span className="font-semibold">Origin:</span> {flight.origin_country}</p>
                    <p><span className="font-semibold">Altitude:</span> {(flight.altitude * 3.28084 / 1000).toFixed(1)}k ft</p>
                    <p><span className="font-semibold">Speed:</span> {flight.velocity ? (flight.velocity * 2.237).toFixed(0) : "N/A"} mph</p>
                    <p><span className="font-semibold">Heading:</span> {flight.heading?.toFixed(0) || "N/A"}°</p>
                    <p className="text-xs text-slate-400 mt-2">ID: {flight.icao24}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats bar */}
      <div className="mt-4 flex items-center justify-between bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-500" />
          <span className="font-semibold">{flights.length}</span>
          <span className="text-slate-600">planes in view</span>
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Crosshair className="w-4 h-4" />
          <span>Updates every 15s • Pan/zoom to explore</span>
        </div>
      </div>
    </div>
  );
}
