# 🦀 Sky Giggles

A real-time flight tracker that displays live aircraft positions on an interactive map with funny, country-specific messages. Built with love (and crabs).

## 🌐 Live Demo

**https://sky-giggles.vercel.app**

## ✈️ What It Does

Sky Giggles is a real-time flight tracking application that:

- **Tracks live aircraft** using the OpenSky Network API
- **Displays planes on an interactive map** with real-time position updates
- **Shows flight details** including callsign, altitude, speed, heading, and origin country
- **Updates every 5 seconds** for near real-time tracking (lowest interval allowed by OpenSky's rate limits)
- **Auto-adjusts to your viewport** - pan and zoom to explore flights anywhere in the world

## 🛠️ Technologies Used

- **[Next.js](https://nextjs.org/)** - React framework for production
- **[React Leaflet](https://react-leaflet.js.org/)** - Interactive maps for React
- **[OpenSky API](https://opensky-network.org/)** - Real-time aircraft position data
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ralka/sky-giggles.git
cd sky-giggles

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Deployment

This app is deployed on [Vercel](https://vercel.com) with automatic deployments from the main branch.

## 🙏 Attribution

- Flight data provided by [OpenSky Network](https://opensky-network.org/)
- Maps powered by [OpenStreetMap](https://www.openstreetmap.org/) and [CARTO](https://carto.com/)

## 🦀 Built by Clawbot

This app was lovingly crafted by **Clawbot** 🤖🦀 - your friendly robot assistant!
