/**
 * SAFEWAY — Smart Road Safety & Risk Intelligence Platform
 * Master Application Architecture & Systems Engine
 */

// Global App State
const APP_STATE = {
  userLocation: { lat: 28.6139, lng: 77.2090, name: "City Center Central Metro" },
  activeRoute: "safest", // 'safest' | 'shortest' | 'alternate'
  mapViewMode: "safety", // 'safety' | 'standard' | 'heatmap'
  heatmapMode: "overall", // 'overall' | 'accident' | 'waterlog' | 'damage'
  heatmapTimeWindow: "7d",
  votedReports: new Set(JSON.parse(localStorage.getItem("safeway_user_votes") || "[]")),
};

// Map instances
let safewayMap = null;
let dangerHeatMap = null;
let heatLayer = null;
let userMarker = null;
let proximityCircle = null;
let activePolylines = [];
let hazardLayerGroup = null;

// Chart.js instances
let chartRisk = null;
let chartCategory = null;
let chartTrends = null;
let chartWeather = null;

// Initial Comprehensive Hazard Database (Simulating Supabase Cloud Storage)
const INITIAL_HAZARDS = [
  {
    id: "RPT-2026-8941",
    title: "Deep Pothole Cluster & Severe Rupture",
    category: "pothole",
    severity: "critical", // low | moderate | high | critical
    riskScore: 88,
    lat: 28.6210,
    lng: 77.2145,
    location: "Barakhamba Road, Lane 2, near Metro Exit 3",
    description: "Multiple sharp rim-bending craters ~12cm deep. Vehicles swerving violently into opposite lane.",
    reportedTime: "24 mins ago",
    confirmations: 38,
    disputes: 1,
    credibility: 96,
    status: "verified", // 'pending' | 'verified' | 'resolved' | 'rejected'
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    aiVerified: true,
    aiConfidence: 94
  },
  {
    id: "RPT-2026-8942",
    title: "Submerged Rail Underpass Waterlogging",
    category: "waterlog",
    severity: "critical",
    riskScore: 94,
    lat: 28.6080,
    lng: 77.2030,
    location: "Minto Bridge Rail Underpass Corridor",
    description: "Water accumulation depth 2.6 ft. Two hatchbacks stalled with hydrolocked engines.",
    reportedTime: "12 mins ago",
    confirmations: 52,
    disputes: 0,
    credibility: 99,
    status: "verified",
    photoUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80",
    aiVerified: true,
    aiConfidence: 97
  },
  {
    id: "RPT-2026-8943",
    title: "Zero Sightline Blind Turn Collision Spot",
    category: "blindturn",
    severity: "high",
    riskScore: 68,
    lat: 28.6295,
    lng: 77.2210,
    location: "Tilak Marg & Bhagwan Das Rd Intersection",
    description: "Sharp corner with overgrown trees blocking sightline and absent convex mirror. 4 collisions logged this month.",
    reportedTime: "1 hour ago",
    confirmations: 19,
    disputes: 2,
    credibility: 88,
    status: "verified",
    photoUrl: "",
    aiVerified: false,
    aiConfidence: 0
  },
  {
    id: "RPT-2026-8944",
    title: "Fallen Tree & Obstructed Carriageway",
    category: "tree",
    severity: "high",
    riskScore: 62,
    lat: 28.6190,
    lng: 77.1980,
    location: "Ashoka Road near Traffic Circle",
    description: "Large bough snapped in storm; partially blocking the central lane without warning cones.",
    reportedTime: "2 hours ago",
    confirmations: 14,
    disputes: 1,
    credibility: 91,
    status: "verified",
    photoUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80",
    aiVerified: true,
    aiConfidence: 91
  },
  {
    id: "RPT-2026-8945",
    title: "High-Frequency Speed Accident Blackspot",
    category: "accident",
    severity: "critical",
    riskScore: 84,
    lat: 28.6020,
    lng: 77.2250,
    location: "Mathura Road Outer Expressway Curve",
    description: "Dangerous camber tilt with wet-surface skid hazard. Fatal accidents recorded at night.",
    reportedTime: "5 hours ago",
    confirmations: 44,
    disputes: 0,
    credibility: 98,
    status: "verified",
    photoUrl: "",
    aiVerified: false,
    aiConfidence: 0
  },
  {
    id: "RPT-2026-8946",
    title: "Broken Streetlight Corridor (Pitch Dark)",
    category: "lighting",
    severity: "moderate",
    riskScore: 42,
    lat: 28.6280,
    lng: 77.2020,
    location: "Panchkuian Marg Link North",
    description: "5 consecutive light poles out of commission. Pedestrians crossing without reflective visibility.",
    reportedTime: "6 hours ago",
    confirmations: 8,
    disputes: 0,
    credibility: 85,
    status: "pending",
    photoUrl: "",
    aiVerified: false,
    aiConfidence: 0
  },
  {
    id: "RPT-2026-8947",
    title: "Unmarked Road Construction Trench",
    category: "construction",
    severity: "high",
    riskScore: 65,
    lat: 28.6150,
    lng: 77.2290,
    location: "Purana Qila Road Service Lane",
    description: "Open trench for fiber optic laying. Missing reflective caution tape.",
    reportedTime: "8 hours ago",
    confirmations: 12,
    disputes: 1,
    credibility: 89,
    status: "pending",
    photoUrl: "",
    aiVerified: false,
    aiConfidence: 0
  },
  {
    id: "RPT-2026-8948",
    title: "Cleared Gravel Spill — Resolved",
    category: "pothole",
    severity: "low",
    riskScore: 15,
    lat: 28.6230,
    lng: 77.2070,
    location: "Janpath North Carriageway",
    description: "Gravel and stone chips sweep completed by municipal authority.",
    reportedTime: "12 hours ago",
    confirmations: 22,
    disputes: 0,
    credibility: 99,
    status: "resolved",
    photoUrl: "",
    aiVerified: false,
    aiConfidence: 0
  }
];

let hazardsData = [];

// Route Definitions (Multiple Routes with Segment Risk Color Coding)
const ROUTES_DATA = {
  safest: {
    id: "safest",
    title: "Outer Bypass Highway (Via Ring West)",
    badge: "RECOMMENDED: SAFEST ROUTE",
    distance: "14.6 km",
    duration: "24 mins",
    overallRisk: 18,
    riskCategory: "Low Risk",
    summary: "Multi-lane arterial highway with modern drainage, bright LED lighting, and zero flood underpasses.",
    segments: [
      {
        name: "Central Station to Ring Junction",
        riskScore: 14,
        category: "low",
        color: "#10b981", // Green
        hazards: "None identified",
        weather: "Light Drizzle (4 mm/h)",
        reports: "2 Verified Clear",
        lastUpdated: "8 mins ago",
        coords: [
          [28.6139, 77.2090],
          [28.6180, 77.2040],
          [28.6230, 77.1990]
        ]
      },
      {
        name: "Ring West Expressway North Corridor",
        riskScore: 22,
        category: "low",
        color: "#10b981", // Green
        hazards: "Minor asphalt roughness",
        weather: "Moderate Rain (10 mm/h)",
        reports: "1 Community Report",
        lastUpdated: "18 mins ago",
        coords: [
          [28.6230, 77.1990],
          [28.6290, 77.1940],
          [28.6360, 77.1900],
          [28.6420, 77.1950]
        ]
      },
      {
        name: "Airport Link Elevated Flyover",
        riskScore: 19,
        category: "low",
        color: "#10b981", // Green
        hazards: "None; high elevation",
        weather: "Heavy Rain (28 mm/h) — Rapid Runoff",
        reports: "Zero incident alerts",
        lastUpdated: "5 mins ago",
        coords: [
          [28.6420, 77.1950],
          [28.6480, 77.2050],
          [28.6520, 77.2150]
        ]
      }
    ]
  },
  shortest: {
    id: "shortest",
    title: "Central Underpass & Old City Corridor",
    badge: "SHORTEST BUT CRITICAL RISK",
    distance: "10.2 km",
    duration: "19 mins",
    overallRisk: 82,
    riskCategory: "Critical Risk",
    summary: "Saves 5 minutes, but contains severe 2.6 ft waterlogging at Minto Underpass, 3 sharp blind turns, and 8 deep craters.",
    segments: [
      {
        name: "Inner Circle to Barakhamba Intersection",
        riskScore: 68,
        category: "high",
        color: "#f97316", // Orange
        hazards: "Deep Pothole Cluster (~12cm)",
        weather: "Heavy Rain (32 mm/h)",
        reports: "38 Verified Driver Reports",
        lastUpdated: "24 mins ago",
        coords: [
          [28.6139, 77.2090],
          [28.6160, 77.2120],
          [28.6210, 77.2145]
        ]
      },
      {
        name: "Minto Rail Underpass Basin",
        riskScore: 94,
        category: "critical",
        color: "#ef4444", // Red (Critical)
        hazards: "Submerged Roadway (2.6 ft depth) • Stalled Sedans",
        weather: "Flash Flooding Threat",
        reports: "52 Verified Driver Reports",
        lastUpdated: "12 mins ago",
        coords: [
          [28.6210, 77.2145],
          [28.6150, 77.2080],
          [28.6080, 77.2030]
        ]
      },
      {
        name: "Old City Cross-Cutting Link",
        riskScore: 78,
        category: "critical",
        color: "#ef4444", // Red
        hazards: "Unsafe Junction • Waterlogging",
        weather: "Heavy Rain (35 mm/h)",
        reports: "19 Verified Reports",
        lastUpdated: "40 mins ago",
        coords: [
          [28.6080, 77.2030],
          [28.6020, 77.2100],
          [28.6520, 77.2150]
        ]
      }
    ]
  },
  alternate: {
    id: "alternate",
    title: "River Boulevard & East Link",
    badge: "ALTERNATIVE SCENIC BYPASS",
    distance: "16.1 km",
    duration: "28 mins",
    overallRisk: 48,
    riskCategory: "High Risk",
    summary: "Active road construction ongoing; narrow lanes and low street lighting past 7:00 PM.",
    segments: [
      {
        name: "East River Embankment Way",
        riskScore: 42,
        category: "moderate",
        color: "#eab308", // Yellow
        hazards: "Slippery wet asphalt",
        weather: "Moderate Rain (12 mm/h)",
        reports: "6 Verified Reports",
        lastUpdated: "1 hour ago",
        coords: [
          [28.6139, 77.2090],
          [28.6110, 77.2180],
          [28.6150, 77.2290]
        ]
      },
      {
        name: "Purana Qila Service Corridor",
        riskScore: 65,
        category: "high",
        color: "#f97316", // Orange
        hazards: "Unmarked Trench • Low Lighting",
        weather: "Heavy Rain (25 mm/h)",
        reports: "12 Verified Reports",
        lastUpdated: "8 hours ago",
        coords: [
          [28.6150, 77.2290],
          [28.6250, 77.2350],
          [28.6380, 77.2300]
        ]
      },
      {
        name: "Northeast Expressway Connector",
        riskScore: 36,
        category: "moderate",
        color: "#eab308", // Yellow
        hazards: "Moderate Traffic Congestion",
        weather: "Overcast",
        reports: "4 Community Reports",
        lastUpdated: "45 mins ago",
        coords: [
          [28.6380, 77.2300],
          [28.6450, 77.2220],
          [28.6520, 77.2150]
        ]
      }
    ]
  }
};

// Heatmap Data Points (lat, lng, intensity)
const HEAT_DATASETS = {
  overall: [
    [28.6210, 77.2145, 0.95],
    [28.6080, 77.2030, 1.0],
    [28.6295, 77.2210, 0.75],
    [28.6190, 77.1980, 0.65],
    [28.6020, 77.2250, 0.9],
    [28.6280, 77.2020, 0.45],
    [28.6150, 77.2290, 0.7],
    [28.6110, 77.2180, 0.5],
    [28.6250, 77.2350, 0.6]
  ],
  accident: [
    [28.6020, 77.2250, 1.0], // Blackspot
    [28.6295, 77.2210, 0.85],
    [28.6160, 77.2120, 0.6],
    [28.6360, 77.2280, 0.5]
  ],
  waterlog: [
    [28.6080, 77.2030, 1.0], // Underpass
    [28.6150, 77.2080, 0.8],
    [28.6110, 77.2050, 0.75],
    [28.6020, 77.2100, 0.7]
  ],
  damage: [
    [28.6210, 77.2145, 0.95], // Potholes
    [28.6190, 77.1980, 0.7],
    [28.6150, 77.2290, 0.75],
    [28.6280, 77.2020, 0.5]
  ]
};

// 10-Slide Deck Data (Original Presentation content fully preserved)
const SLIDES = [
  {
    slideNumber: 1,
    title: "SafeRoute AI (SAFEWAY Platform)",
    subtitle: "AI-Based Road Safety Monitoring and Risk Alert System",
    badge: "HIGH RISK AHEAD",
    contentHtml: `
      <div class="text-center space-y-6 my-auto">
        <div class="w-24 h-24 mx-auto rounded-3xl bg-brand-500/20 border-2 border-brand-500/40 text-brand-400 flex items-center justify-center shadow-2xl">
          <svg class="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.14-2.73 8.05-6 9.08-3.27-1.03-6-4.94-6-9.08V6.43l6-2.25z"/>
          </svg>
        </div>
        <div>
          <span class="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
            ⚠️ High risk ahead
          </span>
          <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">SAFEWAY</h1>
          <p class="text-brand-400 text-lg sm:text-xl font-medium mt-2">AI-Based Road Safety Monitoring and Risk Alert System</p>
        </div>
        <div class="p-4 rounded-2xl bg-surface-950 border border-white/10 max-w-lg mx-auto">
          <p class="text-white text-base font-semibold">"Identify dangerous roads before accidents happen."</p>
        </div>
      </div>
    `
  },
  {
    slideNumber: 2,
    title: "Roads Hide Dangers Maps Don't Show",
    subtitle: "Latent physical hazards and systemic reporting latency",
    badge: "PROBLEM STATEMENT",
    contentHtml: `
      <div class="space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10 text-center"><div class="text-2xl mb-1">🕳️</div><div class="font-bold text-white">Potholes and damaged roads</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10 text-center"><div class="text-2xl mb-1">🌧️</div><div class="font-bold text-white">Waterlogging in heavy rain</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10 text-center"><div class="text-2xl mb-1">⚠️</div><div class="font-bold text-white">Unsafe junctions & blind turns</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10 text-center"><div class="text-2xl mb-1">🚫</div><div class="font-bold text-white">Road obstructions</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10 text-center"><div class="text-2xl mb-1">📍</div><div class="font-bold text-white">Accident-prone locations</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10 text-center"><div class="text-2xl mb-1">⏱️</div><div class="font-bold text-white">Slow, late road information</div></div>
        </div>
        <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-slate-300">
          <strong class="text-white block mb-1">Systemic Lag:</strong>
          Most systems rely on users to report problems, so warnings reach other road users late.
        </div>
      </div>
    `
  },
  {
    slideNumber: 3,
    title: "Seven Objectives, One Road",
    subtitle: "A comprehensive lifecycle from detection to prediction",
    badge: "CORE OBJECTIVES",
    contentHtml: `
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-brand-500 text-surface-950 font-mono font-bold flex items-center justify-center shrink-0">1</span><span class="text-slate-200">Identify dangerous road locations</span></div>
          <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-brand-500 text-surface-950 font-mono font-bold flex items-center justify-center shrink-0">2</span><span class="text-slate-200">Show hazards on a live map</span></div>
          <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-brand-500 text-surface-950 font-mono font-bold flex items-center justify-center shrink-0">3</span><span class="text-slate-200">Let users share hazard reports</span></div>
          <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-brand-500 text-surface-950 font-mono font-bold flex items-center justify-center shrink-0">4</span><span class="text-slate-200">Find routes from start to destination</span></div>
          <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-brand-500 text-surface-950 font-mono font-bold flex items-center justify-center shrink-0">5</span><span class="text-slate-200">Estimate risk along a route</span></div>
          <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-brand-500 text-surface-950 font-mono font-bold flex items-center justify-center shrink-0">6</span><span class="text-slate-200">Alert nearby users to fresh hazards</span></div>
          <div class="p-3 rounded-xl bg-surface-950 border border-purple-500/30 flex items-center gap-3 sm:col-span-2"><span class="w-6 h-6 rounded-full bg-purple-500 text-white font-mono font-bold flex items-center justify-center shrink-0">7</span><span class="text-purple-300 font-semibold">Build AI detection and prediction</span></div>
        </div>
        <div class="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 text-center font-semibold">
          Main idea: identify dangerous roads before accidents happen.
        </div>
      </div>
    `
  },
  {
    slideNumber: 4,
    title: "What the Prototype Does",
    subtitle: "Status of functional components in current build",
    badge: "PROTOTYPE STATUS",
    contentHtml: `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10"><div class="flex justify-between font-bold text-white"><span>Supabase DB</span><span class="text-emerald-400">Working</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10"><div class="flex justify-between font-bold text-white"><span>Hazard reporting</span><span class="text-emerald-400">Working</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10"><div class="flex justify-between font-bold text-white"><span>GPS location</span><span class="text-emerald-400">Working</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10"><div class="flex justify-between font-bold text-white"><span>Live safety map</span><span class="text-emerald-400">Working</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10"><div class="flex justify-between font-bold text-white"><span>From-to routing</span><span class="text-emerald-400">Working</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10"><div class="flex justify-between font-bold text-white"><span>Nearby alerts</span><span class="text-emerald-400">Working</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-amber-500/20"><div class="flex justify-between font-bold text-white"><span>Risk estimate</span><span class="text-amber-400">Rule-based</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-purple-500/20"><div class="flex justify-between font-bold text-white"><span>Camera scan</span><span class="text-purple-400">Capture only</span></div></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-purple-500/20"><div class="flex justify-between font-bold text-white"><span>Video preview</span><span class="text-purple-400">Preview only</span></div></div>
      </div>
    `
  },
  {
    slideNumber: 5,
    title: "Alerts Without a Report",
    subtitle: "Passive Proximity Radar: Zero-tap driver protection",
    badge: "PASSIVE RADAR",
    contentHtml: `
      <div class="space-y-6">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="p-5 rounded-2xl bg-surface-950 border border-white/10"><div class="text-3xl font-extrabold text-brand-400 font-mono">2 km</div><div class="text-xs text-slate-300 mt-2">Radius around GPS</div></div>
          <div class="p-5 rounded-2xl bg-surface-950 border border-white/10"><div class="text-3xl font-extrabold text-sky-400 font-mono">24 h</div><div class="text-xs text-slate-300 mt-2">Recent reports window</div></div>
          <div class="p-5 rounded-2xl bg-surface-950 border border-white/10"><div class="text-3xl font-extrabold text-red-400 font-mono">2 Levels</div><div class="text-xs text-slate-300 mt-2">High & medium triggers</div></div>
        </div>
        <div class="p-4 rounded-xl bg-surface-950 border border-brand-500/30 text-xs text-slate-300 space-y-1">
          <p class="text-brand-400 font-bold">✨ No report needed by driver:</p>
          <p>Users just enable notifications and share location. Proximity scan evaluates distance continuously.</p>
        </div>
      </div>
    `
  },
  {
    slideNumber: 6,
    title: "Map and Route Check",
    subtitle: "Workflow from start to finish",
    badge: "ROUTE ENGINE",
    contentHtml: `
      <div class="space-y-6 text-xs">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10"><div class="text-brand-400 font-bold mb-1">01</div><div class="text-white font-semibold">Enter start and destination</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10"><div class="text-brand-400 font-bold mb-1">02</div><div class="text-white font-semibold">Driving route is drawn</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10"><div class="text-brand-400 font-bold mb-1">03</div><div class="text-white font-semibold">Nearby reports are counted</div></div>
          <div class="p-3.5 rounded-xl bg-surface-950 border border-white/10"><div class="text-brand-400 font-bold mb-1">04</div><div class="text-white font-semibold">Distance, time & risk shown</div></div>
        </div>
        <div class="p-4 rounded-xl bg-surface-950 border border-white/10 space-y-2">
          <div class="text-white font-bold uppercase text-[11px]">Map Colour Code</div>
          <div class="flex justify-between text-slate-300">
            <span class="text-red-400">🔴 High reported risk</span>
            <span class="text-amber-400">🟡 Medium reported risk</span>
            <span class="text-emerald-400">🟢 Lower reported risk</span>
          </div>
        </div>
      </div>
    `
  },
  {
    slideNumber: 7,
    title: "How It Works",
    subtitle: "5-Step operational data pipeline",
    badge: "OPERATIONAL FLOW",
    contentHtml: `
      <div class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex justify-between"><strong>01 Open & load</strong><span class="text-slate-400">Connects to Supabase and loads shared reports</span></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex justify-between"><strong>02 See the map</strong><span class="text-slate-400">Hazards appear as colour-coded markers</span></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex justify-between"><strong>03 Enter a route</strong><span class="text-slate-400">User gives start point and destination</span></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex justify-between"><strong>04 Check risk</strong><span class="text-slate-400">Route drawn; reports & rainfall give an estimate</span></div>
        <div class="p-3 rounded-xl bg-surface-950 border border-white/10 flex justify-between"><strong>05 Get alerted</strong><span class="text-slate-400">With permission, nearby reports trigger notifications</span></div>
      </div>
    `
  },
  {
    slideNumber: 8,
    title: "Technology Stack",
    subtitle: "HTML5, CSS, JS, Supabase, Leaflet, OSRM, Geolocation",
    badge: "TECH STACK",
    contentHtml: `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div class="p-4 rounded-xl bg-surface-950 border border-white/10 space-y-1"><div class="font-bold text-brand-400">Build & Data</div><div>HTML, CSS, JavaScript, Supabase Realtime DB</div></div>
        <div class="p-4 rounded-xl bg-surface-950 border border-white/10 space-y-1"><div class="font-bold text-sky-400">Map & Routing</div><div>Leaflet.js, OpenStreetMap, Nominatim, OSRM Engine</div></div>
        <div class="p-4 rounded-xl bg-surface-950 border border-white/10 space-y-1"><div class="font-bold text-purple-400">Device & Weather</div><div>Geolocation API, Notifications API, Open-Meteo Weather</div></div>
      </div>
    `
  },
  {
    slideNumber: 9,
    title: "Honest Limitations",
    subtitle: "Transparency between current prototype & roadmap",
    badge: "TRANSPARENCY",
    contentHtml: `
      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-surface-950 border border-emerald-500/30 space-y-1">
            <div class="font-bold text-emerald-400">Working Today</div>
            <div>• Community hazard reports & live map<br>• From-to routes with hazard counts<br>• 2km GPS alerts, past 24h<br>• Rule-based route risk estimate</div>
          </div>
          <div class="p-4 rounded-xl bg-surface-950 border border-amber-500/30 space-y-1">
            <div class="font-bold text-amber-400">Not Built Yet</div>
            <div>• AI pothole and crack computer vision<br>• Image and video hazard analysis<br>• Trained ML risk prediction<br>• Push alerts when site is closed</div>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-center text-red-300 font-bold">
          ⚠️ Crucial Note: A road with no reports is not automatically safe.
        </div>
      </div>
    `
  },
  {
    slideNumber: 10,
    title: "Where It Goes Next",
    subtitle: "8-Pillar Future Development Roadmap",
    badge: "NEXT FRONTIER",
    contentHtml: `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">01 Pothole AI</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">02 Waterlogging AI</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">03 Accident Risk ML</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">04 Road Degradation</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">05 Smart Route Choice</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">06 Background Push</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">07 Live CCTV AI</div>
        <div class="p-2.5 rounded-xl bg-surface-950 border border-white/10 font-bold text-white">08 Authority Sync</div>
      </div>
      <div class="mt-4 pt-3 border-t border-white/10 text-center text-xs text-brand-400 font-bold">
        "Smarter Roads, Safer Journeys — Thank You"
      </div>
    `
  }
];

let currentSlideIdx = 0;

/**
 * Lifecycle Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  initSafewayRouteMap();
  initDangerHeatMap();
  initChartsDashboard();
  renderCommunityCards();
  initEventListeners();
  lucide.createIcons();
});

/**
 * LocalStorage & Hydration
 */
function initStorage() {
  const saved = localStorage.getItem("safeway_hazards");
  if (saved) {
    try {
      hazardsData = JSON.parse(saved);
    } catch (e) {
      hazardsData = [...INITIAL_HAZARDS];
    }
  } else {
    hazardsData = [...INITIAL_HAZARDS];
    localStorage.setItem("safeway_hazards", JSON.stringify(hazardsData));
  }
  updateKPICounters();
}

/**
 * MODULE 1: Initialize Smart Safety Route Map
 */
function initSafewayRouteMap() {
  const mapEl = document.getElementById("safewayMap");
  if (!mapEl) return;

  safewayMap = L.map("safewayMap", {
    center: [APP_STATE.userLocation.lat, APP_STATE.userLocation.lng],
    zoom: 14,
    zoomControl: false,
  });

  L.control.zoom({ position: "topright" }).addTo(safewayMap);

  // Add dark tile layer by default
  const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(safewayMap);

  // Apply dark tile class
  safewayMap.getContainer().classList.add("dark-tiles");

  hazardLayerGroup = L.layerGroup().addTo(safewayMap);

  // User Marker with 2km Proximity Radar
  renderUserAndRadar();

  // Render Hazard Pins
  renderHazardPinsOnMap();

  // Draw Default Safest Route
  renderSelectedRoute("safest");
}

/**
 * Render User Pin & 2km Radar Circle
 */
function renderUserAndRadar() {
  if (userMarker) safewayMap.removeLayer(userMarker);
  if (proximityCircle) safewayMap.removeLayer(proximityCircle);

  const userIcon = L.divIcon({
    className: "user-pin-wrapper",
    html: '<div class="user-pin"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  userMarker = L.marker([APP_STATE.userLocation.lat, APP_STATE.userLocation.lng], { icon: userIcon })
    .addTo(safewayMap)
    .bindPopup(`
      <div class="text-xs space-y-1">
        <div class="font-bold text-white flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-brand-400"></span> You (Live GPS Location)
        </div>
        <div class="text-[11px] text-slate-300 font-mono">${APP_STATE.userLocation.lat.toFixed(4)}° N, ${APP_STATE.userLocation.lng.toFixed(4)}° E</div>
        <div class="text-[10px] text-emerald-400 font-bold">2.0 km Proactive Radar Active</div>
      </div>
    `);

  proximityCircle = L.circle([APP_STATE.userLocation.lat, APP_STATE.userLocation.lng], {
    radius: 2000,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.04,
    weight: 1.5,
    dashArray: '6, 6'
  }).addTo(safewayMap);
}

/**
 * Render Hazard Pins with 4-Color Severity
 */
function renderHazardPinsOnMap(filter = "all") {
  if (!hazardLayerGroup) return;
  hazardLayerGroup.clearLayers();

  const filtered = filter === "all" 
    ? hazardsData 
    : hazardsData.filter(h => h.category === filter);

  filtered.forEach(h => {
    let pinClass = "hazard-pin " + h.severity;
    let iconSymbol = "⚠️";

    if (h.category === "pothole") iconSymbol = "🕳️";
    else if (h.category === "waterlog") iconSymbol = "🌧️";
    else if (h.category === "blindturn") iconSymbol = "⚠️";
    else if (h.category === "tree") iconSymbol = "🌳";
    else if (h.category === "construction") iconSymbol = "🚧";
    else if (h.category === "lighting") iconSymbol = "💡";
    else if (h.category === "accident") iconSymbol = "📍";

    const customIcon = L.divIcon({
      className: "custom-marker-wrapper",
      html: `<div class="${pinClass}">${iconSymbol}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([h.lat, h.lng], { icon: customIcon });

    marker.bindPopup(`
      <div class="space-y-2 text-xs">
        <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span class="font-bold text-white">${h.title}</span>
          <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
            h.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
            h.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
            h.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
          }">${h.severity} (${h.riskScore}/100)</span>
        </div>
        <div class="text-[11px] text-slate-300">📍 ${h.location}</div>
        <p class="text-[11px] text-slate-400 leading-snug">${h.description}</p>
        <div class="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>${h.reportedTime}</span>
          <span class="text-brand-400 font-bold">${h.confirmations} Verified</span>
        </div>
      </div>
    `);

    hazardLayerGroup.addLayer(marker);
  });

  const badge = document.getElementById("totalHazardsBadge");
  if (badge) badge.innerText = filtered.length;
}

/**
 * Render Multiple Route Segments with Risk Colors (Green, Yellow, Orange, Red)
 */
function renderSelectedRoute(routeKey) {
  APP_STATE.activeRoute = routeKey;

  // Clear existing polylines
  activePolylines.forEach(p => safewayMap.removeLayer(p));
  activePolylines = [];

  const route = ROUTES_DATA[routeKey];
  if (!route) return;

  // Render each segment with its specific risk color
  route.segments.forEach((seg, idx) => {
    const poly = L.polyline(seg.coords, {
      color: seg.color,
      weight: 6,
      opacity: 0.9,
      dashArray: seg.category === 'critical' ? '8, 6' : null,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(safewayMap);

    // Segment Click Inspector
    poly.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      openSegmentInspector(seg);
    });

    // Hover effect
    poly.on("mouseover", () => poly.setStyle({ weight: 9 }));
    poly.on("mouseout", () => poly.setStyle({ weight: 6 }));

    activePolylines.push(poly);
  });

  // Fit bounds to route
  const allCoords = route.segments.flatMap(s => s.coords);
  const bounds = L.latLngBounds(allCoords);
  safewayMap.fitBounds(bounds, { padding: [60, 60] });

  // Update Route Selection Cards UI
  ["safest", "shortest", "alternate"].forEach(k => {
    const card = document.getElementById(`routeCard-${k}`);
    if (card) {
      if (k === routeKey) {
        card.classList.add("selected");
        card.style.borderColor = "#10b981";
      } else {
        card.classList.remove("selected");
        card.style.borderColor = "rgba(255,255,255,0.1)";
      }
    }
  });
}

window.selectRouteOption = function(routeKey) {
  renderSelectedRoute(routeKey);
};

/**
 * Open Segment Click Inspector (Module 1 Requirement)
 */
function openSegmentInspector(seg) {
  const box = document.getElementById("segmentInspectorBox");
  if (!box) return;

  box.classList.remove("hidden");

  // Populate data
  document.getElementById("inspectorRoadName").innerText = seg.name;
  document.getElementById("inspectorScoreVal").innerText = seg.riskScore;
  document.getElementById("inspectorSegmentDesc").innerText = `Assessed ${seg.category.toUpperCase()} hazard corridor with active spatial telemetry.`;
  document.getElementById("inspectorHazardsList").innerText = seg.hazards;
  document.getElementById("inspectorWeatherVal").innerText = seg.weather;
  document.getElementById("inspectorCommunityCount").innerText = seg.reports;
  document.getElementById("inspectorTimestamp").innerText = seg.lastUpdated;

  const badge = document.getElementById("inspectorRiskBadge");
  const circle = document.getElementById("inspectorRiskCircle");

  if (seg.category === "critical") {
    badge.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 uppercase";
    badge.innerText = "Critical Risk";
    circle.className = "w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex flex-col items-center justify-center font-mono font-black";
  } else if (seg.category === "high") {
    badge.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 uppercase";
    badge.innerText = "High Risk";
    circle.className = "w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex flex-col items-center justify-center font-mono font-black";
  } else if (seg.category === "moderate") {
    badge.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-400 uppercase";
    badge.innerText = "Moderate Risk";
    circle.className = "w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex flex-col items-center justify-center font-mono font-black";
  } else {
    badge.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 uppercase";
    badge.innerText = "Low Risk";
    circle.className = "w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex flex-col items-center justify-center font-mono font-black";
  }

  lucide.createIcons();
}

window.closeSegmentInspector = function() {
  const box = document.getElementById("segmentInspectorBox");
  if (box) box.classList.add("hidden");
};

/**
 * Filter Hazard Pins on Map
 */
window.toggleHazardMarkersFilter = function(filterCategory) {
  renderHazardPinsOnMap(filterCategory);

  const filters = ["all", "waterlog", "pothole", "accident"];
  filters.forEach(f => {
    const btn = document.getElementById(`filterBtn-${f}`);
    if (btn) {
      if (f === filterCategory) {
        btn.className = "px-2.5 py-1.5 rounded-lg bg-brand-500 text-surface-950 font-bold transition";
      } else {
        btn.className = "px-2.5 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 transition";
      }
    }
  });
};

/**
 * Map Centering & Reset
 */
window.centerMapToUser = function() {
  if (safewayMap) {
    safewayMap.setView([APP_STATE.userLocation.lat, APP_STATE.userLocation.lng], 15, { animate: true });
    if (userMarker) userMarker.openPopup();
  }
};

window.resetSmartMapView = function() {
  if (safewayMap) {
    safewayMap.setView([APP_STATE.userLocation.lat, APP_STATE.userLocation.lng], 14, { animate: true });
  }
};

/**
 * MODULE 5: Initialize Road Danger Heat Map
 */
function initDangerHeatMap() {
  const heatEl = document.getElementById("dangerHeatMap");
  if (!heatEl || !window.L || !L.heatLayer) return;

  dangerHeatMap = L.map("dangerHeatMap", {
    center: [APP_STATE.userLocation.lat, APP_STATE.userLocation.lng],
    zoom: 14,
    zoomControl: false,
  });

  L.control.zoom({ position: "topright" }).addTo(dangerHeatMap);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(dangerHeatMap);

  dangerHeatMap.getContainer().classList.add("dark-tiles");

  // Render initial HeatLayer
  updateHeatmapData();
}

window.switchHeatmapMode = function(mode) {
  APP_STATE.heatmapMode = mode;

  const modes = ["overall", "accident", "waterlog", "damage"];
  modes.forEach(m => {
    const btn = document.getElementById(`heatBtn-${m}`);
    if (btn) {
      if (m === mode) {
        btn.className = "px-3 py-1.5 rounded-lg bg-orange-500 text-surface-950 font-bold transition";
      } else {
        btn.className = "px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition";
      }
    }
  });

  updateHeatmapData();
};

window.updateHeatmapData = function() {
  if (!dangerHeatMap || !L.heatLayer) return;

  if (heatLayer) dangerHeatMap.removeLayer(heatLayer);

  const dataset = HEAT_DATASETS[APP_STATE.heatmapMode] || HEAT_DATASETS.overall;

  heatLayer = L.heatLayer(dataset, {
    radius: 30,
    blur: 20,
    maxZoom: 17,
    gradient: {
      0.2: '#3b82f6', // blue (low)
      0.5: '#eab308', // yellow
      0.7: '#f97316', // orange
      1.0: '#ef4444'  // red (critical)
    }
  }).addTo(dangerHeatMap);
};

/**
 * MODULE 3: Weather Data Sync Simulator
 */
window.refreshLiveWeatherData = function() {
  showToast("Syncing Live Weather Telemetry (Open-Meteo & Radar)...");

  setTimeout(() => {
    const rain = (28 + Math.floor(Math.random() * 12));
    const prob = (80 + Math.floor(Math.random() * 15));
    const vis = (2.0 + Math.random() * 0.8).toFixed(1);

    document.getElementById("weatherRainIntensity").innerText = `${rain} mm/h`;
    document.getElementById("weatherRainProb").innerText = `${prob}%`;
    document.getElementById("weatherVisibility").innerText = `${vis} km`;

    showToast("Live Weather Radar Refreshed: Heavy Rain Advisory active.");
  }, 600);
};

/**
 * MODULE 8: Community Verification Hub Cards
 */
function renderCommunityCards() {
  const container = document.getElementById("communityReportsGrid");
  if (!container) return;

  const filter = document.getElementById("communityStatusFilter")?.value || "all";

  const filtered = filter === "all"
    ? hazardsData
    : hazardsData.filter(h => h.status === filter);

  container.innerHTML = filtered.map(h => {
    const hasVoted = APP_STATE.votedReports.has(h.id);

    return `
      <div class="p-5 rounded-2xl bg-surface-900 border border-white/10 flex flex-col justify-between space-y-4 hover:border-brand-500/30 transition">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
              h.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              h.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              h.status === 'resolved' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-red-500/20 text-red-400'
            }">
              ${h.status === 'verified' ? '✓ Community Verified' : h.status === 'pending' ? '⏳ Pending Review' : '✅ Resolved'}
            </span>
            <span class="text-[10px] font-mono text-slate-500">${h.id}</span>
          </div>

          <div>
            <h4 class="text-sm font-bold text-white">${h.title}</h4>
            <div class="text-[11px] text-slate-400 mt-0.5">📍 ${h.location}</div>
          </div>

          <p class="text-xs text-slate-300 leading-snug line-clamp-2">${h.description}</p>

          ${h.photoUrl ? `
            <div class="rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/5 relative">
              <img src="${h.photoUrl}" alt="Proof" class="w-full h-full object-cover">
              ${h.aiVerified ? `
                <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-brand-500 text-surface-950 font-mono text-[9px] font-bold">
                  AI VISION: ${h.aiConfidence}% CONFIDENCE
                </span>
              ` : ''}
            </div>
          ` : ''}

          <!-- Credibility Meter -->
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-mono">
              <span class="text-slate-400">Credibility Index:</span>
              <span class="text-brand-400 font-bold">${h.credibility}%</span>
            </div>
            <div class="w-full bg-surface-950 h-1.5 rounded-full overflow-hidden">
              <div class="bg-brand-500 h-full" style="width: ${h.credibility}%"></div>
            </div>
          </div>
        </div>

        <!-- Community Actions -->
        <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <button onclick="voteConfirmHazard('${h.id}')" ${hasVoted ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg ${hasVoted ? 'bg-surface-800 text-slate-500 cursor-not-allowed' : 'bg-brand-500/20 hover:bg-brand-500 hover:text-surface-950 text-brand-400'} font-semibold transition flex items-center gap-1.5">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span>Confirm (${h.confirmations})</span>
          </button>

          <button onclick="markHazardResolved('${h.id}')" class="px-2.5 py-1.5 rounded-lg bg-surface-800 hover:bg-purple-600 hover:text-white text-slate-300 font-semibold transition">
            Mark Resolved
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

window.filterCommunityReports = function() {
  renderCommunityCards();
};

window.voteConfirmHazard = function(hazardId) {
  if (APP_STATE.votedReports.has(hazardId)) return;

  const item = hazardsData.find(h => h.id === hazardId);
  if (item) {
    item.confirmations += 1;
    item.credibility = Math.min(100, item.credibility + 2);
    if (item.confirmations >= 10 && item.status === "pending") {
      item.status = "verified";
    }

    APP_STATE.votedReports.add(hazardId);
    localStorage.setItem("safeway_user_votes", JSON.stringify([...APP_STATE.votedReports]));
    localStorage.setItem("safeway_hazards", JSON.stringify(hazardsData));

    renderCommunityCards();
    updateKPICounters();
    showToast(`Confirmed! Community confirmation logged for ${item.id}`);
  }
};

window.markHazardResolved = function(hazardId) {
  const item = hazardsData.find(h => h.id === hazardId);
  if (item) {
    item.status = "resolved";
    item.severity = "low";
    item.riskScore = 15;
    localStorage.setItem("safeway_hazards", JSON.stringify(hazardsData));
    renderCommunityCards();
    updateKPICounters();
    renderHazardPinsOnMap();
    showToast(`Hazard ${item.id} has been marked as Resolved.`);
  }
};

/**
 * MODULE 6: Photo Upload & AI Vision Assistant
 */
function initPhotoUploadHandlers() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("evidenceFileInput");
  const form = document.getElementById("evidenceReportForm");

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        handleSelectedImage(file);
      }
    });

    // Drag & Drop
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("border-brand-500");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("border-brand-500");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("border-brand-500");
      if (e.dataTransfer.files[0]) {
        handleSelectedImage(e.dataTransfer.files[0]);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitHazardEvidenceForm();
    });
  }
}

function handleSelectedImage(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file (JPG, PNG, WEBP).");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("previewImg").src = e.target.result;
    document.getElementById("uploadPrompt").classList.add("hidden");
    document.getElementById("imagePreviewContainer").classList.remove("hidden");
    
    // Simulate AI Vision Scan after 700ms
    setTimeout(() => {
      document.getElementById("aiBoundingBoxOverlay").classList.remove("hidden");
      lucide.createIcons();
    }, 700);
  };
  reader.readAsDataURL(file);
}

window.removeUploadedImage = function() {
  document.getElementById("previewImg").src = "";
  document.getElementById("uploadPrompt").classList.remove("hidden");
  document.getElementById("imagePreviewContainer").classList.add("hidden");
  document.getElementById("aiBoundingBoxOverlay").classList.add("hidden");
  document.getElementById("evidenceFileInput").value = "";
};

window.attachCurrentDeviceGPS = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        APP_STATE.userLocation.lat = pos.coords.latitude;
        APP_STATE.userLocation.lng = pos.coords.longitude;
        document.getElementById("evidenceCoordinatesText").innerText = 
          `Attached Coordinates: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`;
        renderUserAndRadar();
        showToast("High-precision GPS coordinates locked to report.");
      },
      () => {
        showToast("Geolocation access denied. Using central coordinates.");
      }
    );
  }
};

function submitHazardEvidenceForm() {
  const category = document.getElementById("evidenceCategory").value;
  const location = document.getElementById("evidenceLocationInput").value;
  const notes = document.getElementById("evidenceNotes").value || "Driver hazard photo report submitted to spatial verification queue.";
  const previewSrc = document.getElementById("previewImg").getAttribute("src");

  // Animate upload progress
  const progressContainer = document.getElementById("uploadProgressBarContainer");
  const progressFill = document.getElementById("uploadProgressFill");
  const progressPercent = document.getElementById("uploadProgressPercent");

  progressContainer.classList.remove("hidden");
  progressFill.style.width = "0%";
  progressPercent.innerText = "0%";

  let progress = 0;
  const interval = setInterval(() => {
    progress += 25;
    progressFill.style.width = `${progress}%`;
    progressPercent.innerText = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        progressContainer.classList.add("hidden");

        const newId = `RPT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const newHazard = {
          id: newId,
          title: `${category.toUpperCase()} Obstacle Reported`,
          category: category,
          severity: "high",
          riskScore: 72,
          lat: APP_STATE.userLocation.lat + (Math.random() - 0.5) * 0.012,
          lng: APP_STATE.userLocation.lng + (Math.random() - 0.5) * 0.012,
          location: location,
          description: notes,
          reportedTime: "Just now",
          confirmations: 1,
          disputes: 0,
          credibility: 85,
          status: "pending",
          photoUrl: previewSrc || "",
          aiVerified: previewSrc ? true : false,
          aiConfidence: previewSrc ? 93 : 0
        };

        hazardsData.unshift(newHazard);
        localStorage.setItem("safeway_hazards", JSON.stringify(hazardsData));

        renderCommunityCards();
        renderHazardPinsOnMap();
        updateKPICounters();
        removeUploadedImage();
        document.getElementById("evidenceReportForm").reset();

        if (window.confetti) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        }

        showToast(`Report ${newId} submitted! Dispatched for community verification.`);
      }, 300);
    }
  }, 200);
}

/**
 * MODULE 7: Chart.js Safety Analytics Dashboard
 */
function initChartsDashboard() {
  const ctxRisk = document.getElementById("riskDoughnutChart");
  const ctxCat = document.getElementById("categoryBarChart");
  const ctxTrend = document.getElementById("trendsLineChart");
  const ctxWeather = document.getElementById("weatherCorrelationChart");

  if (!window.Chart) return;

  // Chart 1: Risk Distribution
  if (ctxRisk) {
    chartRisk = new Chart(ctxRisk, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk (0-25)', 'Moderate (26-45)', 'High Risk (46-70)', 'Critical (71-100)'],
        datasets: [{
          data: [42, 28, 18, 12],
          backgroundColor: ['#10b981', '#eab308', '#f97316', '#ef4444'],
          borderColor: '#0b1120',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // Chart 2: Category Bar Chart
  if (ctxCat) {
    chartCategory = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: ['Potholes', 'Waterlogging', 'Blind Turns', 'Obstructions', 'Accidents', 'Lighting', 'Construction'],
        datasets: [{
          label: 'Incidents Logged',
          data: [68, 54, 38, 29, 44, 21, 26],
          backgroundColor: '#34d399',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // Chart 3: Trends Line
  if (ctxTrend) {
    chartTrends = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Reported Hazards',
            data: [45, 58, 72, 64],
            borderColor: '#f97316',
            tension: 0.35,
            fill: false
          },
          {
            label: 'Resolved By Authority',
            data: [20, 34, 48, 52],
            borderColor: '#10b981',
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // Chart 4: Weather Correlation
  if (ctxWeather) {
    chartWeather = new Chart(ctxWeather, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Rainfall (mm)',
            data: [4, 12, 35, 42, 28, 6, 2],
            backgroundColor: '#38bdf8',
            borderRadius: 6
          },
          {
            label: 'Flood Incidents',
            data: [0, 2, 8, 14, 9, 1, 0],
            backgroundColor: '#ef4444',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

window.updateAnalyticsTimeframe = function(period) {
  const btnWeek = document.getElementById("timeframe-week");
  const btnMonth = document.getElementById("timeframe-month");

  if (period === "week") {
    btnWeek.className = "px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold shadow";
    btnMonth.className = "px-3 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-slate-300 text-xs font-semibold border border-white/10";
    if (chartCategory) {
      chartCategory.data.datasets[0].data = [24, 18, 12, 9, 15, 7, 8];
      chartCategory.update();
    }
  } else {
    btnMonth.className = "px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold shadow";
    btnWeek.className = "px-3 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-slate-300 text-xs font-semibold border border-white/10";
    if (chartCategory) {
      chartCategory.data.datasets[0].data = [68, 54, 38, 29, 44, 21, 26];
      chartCategory.update();
    }
  }
  showToast(`Analytics filtered for past ${period === 'week' ? '7 days' : '30 days'}`);
};

function updateKPICounters() {
  const total = hazardsData.length;
  const verified = hazardsData.filter(h => h.status === 'verified').length;
  const pending = hazardsData.filter(h => h.status === 'pending').length;
  const critical = hazardsData.filter(h => h.severity === 'critical').length;
  const resolved = hazardsData.filter(h => h.status === 'resolved').length;

  const totalEl = document.getElementById("kpiTotalReports");
  const verifiedEl = document.getElementById("kpiVerifiedReports");
  const pendingEl = document.getElementById("kpiPendingReports");
  const criticalEl = document.getElementById("kpiCriticalLocations");
  const resolvedEl = document.getElementById("kpiResolvedReports");
  const heroVerified = document.getElementById("heroVerifiedCount");

  if (totalEl) totalEl.innerText = total * 18; // scaled
  if (verifiedEl) verifiedEl.innerText = verified * 16;
  if (pendingEl) pendingEl.innerText = pending * 10;
  if (criticalEl) criticalEl.innerText = critical;
  if (resolvedEl) resolvedEl.innerText = resolved * 8;
  if (heroVerified) heroVerified.innerText = `${verified * 16}+`;
}

/**
 * MODULE 9: Smart Nearby Proximity Radar Simulation
 */
window.triggerImmediateNearbyRadarCheck = function() {
  playAlertTone();

  // Slide in Alert Toast
  const toast = document.getElementById("proximityAlertToast");
  if (toast) {
    toast.classList.remove("translate-x-[120%]");
    toast.classList.add("translate-x-0");
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("⚠️ CRITICAL ROAD HAZARD (450m Ahead)", {
      body: "Submerged Rail Underpass Waterlogging (2.6 ft). Avoid left lane.",
      icon: "https://unpkg.com/lucide-static@0.321.0/icons/shield-alert.svg"
    });
  }

  showToast("Proximity Radar: High-threat hazard detected 450m on heading trajectory!");
};

window.dismissProximityToast = function() {
  const toast = document.getElementById("proximityAlertToast");
  if (toast) {
    toast.classList.remove("translate-x-0");
    toast.classList.add("translate-x-[120%]");
  }
};

window.requestPushNotificationPermissions = function() {
  if (!("Notification" in window)) {
    showToast("This browser does not support WebPush notifications.");
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      showToast("✓ OS Push Notifications successfully activated!");
      new Notification("SAFEWAY Alert System", {
        body: "Proactive road safety warnings are now enabled.",
        icon: "https://unpkg.com/lucide-static@0.321.0/icons/shield-check.svg"
      });
    } else {
      showToast("Notification permission was not granted.");
    }
  });
};

function playAlertTone() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(480, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, audioCtx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

/**
 * Toast Notification Helper
 */
function showToast(msg) {
  const existing = document.getElementById("globalAppToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "globalAppToast";
  toast.className = "fixed bottom-6 right-6 z-50 bg-surface-900 border border-brand-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300";
  toast.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping"></span>
    <span>${msg}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

/**
 * UI Navigation & Presentation Deck
 */
function initEventListeners() {
  // Mobile Nav
  const mobBtn = document.getElementById("mobileMenuBtn");
  const mobMenu = document.getElementById("mobileMenu");
  if (mobBtn && mobMenu) {
    mobBtn.addEventListener("click", () => mobMenu.classList.toggle("hidden"));
  }

  // Report CTAs
  const navReport = document.getElementById("navReportBtn");
  if (navReport) {
    navReport.addEventListener("click", () => {
      const section = document.getElementById("report-section");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });
  }

  // View switchers
  const btnStd = document.getElementById("viewStandardMapBtn");
  const btnSafe = document.getElementById("viewSafetyMapBtn");
  const btnHeat = document.getElementById("viewHeatmapBtn");

  if (btnStd && btnSafe && btnHeat) {
    btnStd.addEventListener("click", () => {
      safewayMap.getContainer().classList.remove("dark-tiles");
      safewayMap.getContainer().classList.add("standard-tiles");
      btnStd.className = "px-3 py-1.5 rounded-lg bg-surface-800 text-white font-bold transition";
      btnSafe.className = "px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition";
    });

    btnSafe.addEventListener("click", () => {
      safewayMap.getContainer().classList.add("dark-tiles");
      safewayMap.getContainer().classList.remove("standard-tiles");
      btnSafe.className = "px-3 py-1.5 rounded-lg bg-brand-500 text-surface-950 font-bold transition";
      btnStd.className = "px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition";
    });

    btnHeat.addEventListener("click", () => {
      const heatSec = document.getElementById("heat-map");
      if (heatSec) heatSec.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Toggle Alert Radar button in Nav
  const alertRadarBtn = document.getElementById("toggleAlertRadarBtn");
  if (alertRadarBtn) {
    alertRadarBtn.addEventListener("click", triggerImmediateNearbyRadarCheck);
  }

  // Calculate Routes Button in Map form
  const calcBtn = document.getElementById("calculateRoutesBtn");
  if (calcBtn) {
    calcBtn.addEventListener("click", () => {
      renderSelectedRoute("safest");
      showToast("Multi-route comparative analysis completed. Safest Route applied.");
    });
  }

  // Photo Upload handlers
  initPhotoUploadHandlers();

  // Slide Deck Handlers
  initSlideDeckHandlers();
}

/**
 * Slide Deck Viewer Logic
 */
function initSlideDeckHandlers() {
  const deckModal = document.getElementById("deckModal");
  const openBtns = [
    document.getElementById("openDeckBtnTop"),
    document.getElementById("openDeckBtnMobile")
  ];
  const closeBtn = document.getElementById("closeDeckModalBtn");
  const prevBtn = document.getElementById("prevSlideBtn");
  const nextBtn = document.getElementById("nextSlideBtn");

  openBtns.forEach(b => {
    if (b) b.addEventListener("click", () => openSlideDeck(0));
  });

  if (closeBtn) closeBtn.addEventListener("click", closeSlideDeck);
  if (prevBtn) prevBtn.addEventListener("click", () => changeSlide(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => changeSlide(1));

  window.addEventListener("keydown", (e) => {
    if (deckModal && !deckModal.classList.contains("hidden")) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        changeSlide(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        changeSlide(-1);
      } else if (e.key === "Escape") {
        closeSlideDeck();
      }
    }
  });
}

function openSlideDeck(idx = 0) {
  currentSlideIdx = idx;
  const modal = document.getElementById("deckModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    renderCurrentSlide();
  }
}

function closeSlideDeck() {
  const modal = document.getElementById("deckModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function changeSlide(dir) {
  const next = currentSlideIdx + dir;
  if (next >= 0 && next < SLIDES.length) {
    currentSlideIdx = next;
    renderCurrentSlide();
  }
}

function renderCurrentSlide() {
  const slide = SLIDES[currentSlideIdx];
  const container = document.getElementById("slideContainer");
  const counter = document.getElementById("currentSlideNum");

  if (counter) counter.innerText = slide.slideNumber;

  if (container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-brand-500/20 text-brand-400 border border-brand-500/30">
            ${slide.badge}
          </span>
          <span class="text-xs font-mono text-slate-400">SLIDE 0${slide.slideNumber}</span>
        </div>

        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${slide.title}</h2>
          <p class="text-sm text-slate-300 mt-1">${slide.subtitle}</p>
        </div>

        <div class="py-4">
          ${slide.contentHtml}
        </div>
      </div>

      <div class="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>SAFEWAY Intelligence • Slide Deck</span>
        <span>${slide.slideNumber} of ${SLIDES.length}</span>
      </div>
    `;

    lucide.createIcons();
  }
}
