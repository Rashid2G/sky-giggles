"use client";

import dynamic from "next/dynamic";
import { Plane } from "lucide-react";

const FlightMap = dynamic(() => import("./FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-xl">
      <Plane className="w-16 h-16 text-slate-400 animate-bounce" />
      <p className="mt-4 text-slate-600 font-medium">Loading map...</p>
    </div>
  ),
});

interface FlightMapWrapperProps {
  originLat: number;
  originLon: number;
}

export default function FlightMapWrapper({ originLat, originLon }: FlightMapWrapperProps) {
  return <FlightMap originLat={originLat} originLon={originLon} />;
}
