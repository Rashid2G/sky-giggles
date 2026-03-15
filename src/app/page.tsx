import dynamic from "next/dynamic";
import { Plane, Globe, Zap } from "lucide-react";

// Dynamically import FlightMap with SSR disabled (Leaflet needs window)
const FlightMap = dynamic(() => import("@/components/FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-xl">
      <Plane className="w-16 h-16 text-slate-400 animate-bounce" />
      <p className="mt-4 text-slate-600 font-medium">Loading map...</p>
    </div>
  ),
});

// Country to approximate lat/lon mapping (capital cities for positioning)
const countryCoordinates: Record<string, [number, number]> = {
  "United States": [38.9072, -77.0369],
  "United Kingdom": [51.5074, -0.1278],
  "Germany": [52.5200, 13.4050],
  "France": [48.8566, 2.3522],
  "Spain": [40.4168, -3.7038],
  "Italy": [41.9028, 12.4964],
  "Netherlands": [52.3676, 4.9041],
  "Saudi Arabia": [24.7136, 46.6753],
  "United Arab Emirates": [25.2048, 55.2708],
  "Japan": [35.6762, 139.6503],
  "Australia": [-35.2809, 149.1300],
  "Canada": [45.4215, -75.6972],
  "Brazil": [-15.7975, -47.8919],
  "India": [28.6139, 77.2090],
  "China": [39.9042, 116.4074],
  "Russia": [55.7558, 37.6173],
  "default": [25.0, 45.0], // Middle of the map as fallback
};

// Funny messages based on country
const funnyMessages: Record<string, string> = {
  "United States": "🇺🇸 Land of the free, home of the delayed flights",
  "United Kingdom": "🇬🇧 Cheerio! Spot some planes while having tea",
  "Germany": "🇩🇪 Precision engineering... now watch those planes land ON TIME",
  "France": "🇫🇷 Are those planes carrying baguettes? Let's find out",
  "Saudi Arabia": "🇸🇦 Welcome! Hope you're not tracking the royal flight 👀",
  "United Arab Emirates": "🇦🇪 Dubai! Where the skyscrapers compete with airplanes for height",
  "default": "🌍 You're somewhere on this beautiful planet. That's... something!",
};

async function getClientLocation(): Promise<{ country: string; lat: number; lon: number }> {
  // Try to get country from IP geolocation API
  try {
    const response = await fetch("https://ipapi.co/json/", { next: { revalidate: 3600 } });
    const data = await response.json();
    const country = data.country_name || "default";
    
    // If we got coordinates from ipapi, use them, otherwise fallback to city coords
    const coords = countryCoordinates[country] || [data.latitude || 25, data.longitude || 45];
    
    return {
      country: country,
      lat: coords[0],
      lon: coords[1],
    };
  } catch (error) {
    // Default to somewhere interesting if we can't detect
    return {
      country: "The void",
      lat: 25,
      lon: 45,
    };
  }
}

export default async function Home() {
  const location = await getClientLocation();
  const message = funnyMessages[location.country] || funnyMessages["default"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Plane className="w-10 h-10 text-blue-600 animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Sky Giggles
            </h1>
            <Plane className="w-10 h-10 text-blue-600" style={{ transform: 'scaleX(-1)' }} />
          </div>
          <p className="text-xl text-slate-600 font-medium">{message}</p>
          <p className="text-sm text-slate-400 mt-2">
            Detected: {location.country} · {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-8">
          <FlightMap originLat={location.lat} originLon={location.lon} />
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/70 backdrop-blur p-6 rounded-xl shadow-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-6 h-6 text-blue-500" />
              <h3 className="font-bold text-slate-800">Global Tracking</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Real-time aircraft positions from OpenSky Network. Watch planes zigzag across the sky!
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur p-6 rounded-xl shadow-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h3 className="font-bold text-slate-800">Live Updates</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Fresh data every 15 seconds. If a plane disappears, it probably landed... hopefully.
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur p-6 rounded-xl shadow-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <Plane className="w-6 h-6 text-emerald-500" />
              <h3 className="font-bold text-slate-800">Flight Details</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Click any plane to see callsign, altitude, speed, and mysterious ICAO codes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur px-6 py-3 rounded-full border border-slate-200">
            <p className="text-sm text-slate-500">
              Data from OpenSky Network · Built with Next.js · Leaflet
            </p>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">This app is built by Clawbot 🦀</p>
        </div>
      </div>
    </main>
  );
}
