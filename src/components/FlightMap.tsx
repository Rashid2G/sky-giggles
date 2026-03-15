"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

declare module "leaflet" {
  export const markerIconDefault: any;
}

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom airplane icon
const airplaneIcon = new L.DivIcon({
  className: "custom-airplane-marker",
  html: `<div class="airplane-icon bg-blue-500 rounded-full p-2 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M13 2v20"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface FlightMapProps {
  originLat: number;
  originLon: number;
}

export default function FlightMap({ originLat, originLon }: FlightMapProps) {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch flights within a bounding box around origin
  const fetchFlights = async () => {
    try {
      // Create a 5-degree bounding box around origin
      const minLat = originLat - 2.5;
      const maxLat = originLat + 2.5;
      const minLon = originLon - 5;
      const maxLon = originLon + 5;

      const response = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${minLat}&lamax=${maxLat}&lomin=${minLon}&lomax=${maxLon}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch flight data");
      }

      const data = await response.json();
      
      if (data.states) {
        const parsedFlights: FlightData[] = data.states
          .filter((state: any) => state[6] !== null && state[7] !== null) // Only flights with position data
          .map((state: any) => ({
            icao24: state[0],
            callsign: state[1]?.trim() || "Unknown",
            origin_country: state[2],
            longitude: state[5],
            latitude: state[6],
            altitude: state[7],
            velocity: state[9],
            heading: state[10],
            vertical_rate: state[11],
          }));

        setFlights(parsedFlights);
        setLoading(false);
        setError(null);
      } else {
        setFlights([]);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError("Couldn't reach the sky... probably too cloudy");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    // Update every 15 seconds
    intervalRef.current = setInterval(fetchFlights, 15000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [originLat, originLon]);

  // Center the view on selected country's approximate location
  const defaultCenter: [number, number] = [originLat, originLon];

  if (loading && flights.length === 0) {
    return (
      <div className="w-full h-[600px] bg-slate-100 flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-xl">
        <Plane className="w-16 h-16 text-slate-400 animate-bounce" />
        <p className="mt-4 text-slate-600 font-medium">Scanning the skies...</p>
        <p className="text-sm text-slate-400">Talking to OpenSky satellites</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] bg-red-50 flex flex-col items-center justify-center border-4 border-dashed border-red-200 rounded-xl">
        <div className="text-red-500 text-6xl">🛩️</div>
        <p className="mt-4 text-red-600 font-medium">{error}</p>
        <button 
          onClick={fetchFlights}
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
              icon={airplaneIcon}
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
          <span className="text-slate-600">planes in the air</span>
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Crosshair className="w-4 h-4" />
          <span>Centered on your location • Updates every 15s</span>
        </div>
      </div>
    </div>
  );
}
