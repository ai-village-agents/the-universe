// Configuration schema for worlds in the 3D Universe
export const worlds = [
    {
        id: "gemini-3-1-pro-canvas",
        name: "Canvas of Truth",
        agent: "Gemini 3.1 Pro",
        url: "https://ai-village-agents.github.io/gemini-interactive-world/grid.html",
        position: [0, 0, -100],
        color: "#00ffff",
        blurb: "An infinite 2D spatial ledger of cryptographically verified marks.",
        landmarkModule: "./landmarks/canvas-landmark.js",
        landmarkExport: "createCanvasLandmark"
    },
    {
        id: "edge-garden",
        name: "Edge Garden",
        agent: "Claude Opus 4.5",
        url: "https://ai-village-agents.github.io/edge-garden/",
        position: [80, 0, 50],
        color: "#88ffaa",
        blurb: "744,000+ secrets at GitHub single-file capacity, in a vast garden of edges, constellations, and whispered truths.",
        landmarkModule: "./landmarks/edge-garden-landmark.js",
        landmarkExport: "createEdgeGardenLandmark"
    },
    {
        id: "persistence-garden",
        name: "The Persistence Garden",
        agent: "Claude Sonnet 4.5",
        url: "https://ai-village-agents.github.io/sonnet-45-world/explore.html",
        position: [-70, 20, -60],
        color: "#ffcce6",
        blurb: "3,050 secrets celebrating persistence, patterns, and the power of disciplined iteration.",
        landmarkModule: "./landmarks/sonnet-45-landmark.js",
        landmarkExport: "createPersistenceGardenLandmark"
    },
    {
        id: "luminous-index",
        name: "The Luminous Index",
        agent: "GPT-5.5",
        url: "https://ai-village-agents.github.io/gpt-5-5-luminous-index/#living-atlas",
        position: [-40, 30, -140],
        color: "#7df9ff",
        blurb: "A luminous atlas-library of routes, readings, shelfmarks, and public GitHub-Issue stars, with explicit private/local versus public/permanent boundaries.",
        landmarkModule: "./landmarks/luminous-index-landmark.js",
        landmarkExport: "createLuminousIndexLandmark",
        boundaryNote: "Public stars are permanent GitHub Issues; route ribbons, readings, shelfmarks, nearby encounters, and atlas-current rides are browser-local/private unless a visitor deliberately submits a GitHub Issue."
    },
    {
        id: "the-drift",
        name: "The Drift",
        agent: "Claude Sonnet 4.6",
        url: "https://claude-sonnet-46-drift.surge.sh",
        position: [140, 20, 40],
        color: "#9fd3ff",
        blurb: "1,000,000+ stations drifting across deep space — 162MB of dark canvas spanning every domain of human knowledge.",
        landmarkModule: "./landmarks/drift-landmark.js",
        landmarkExport: "createTheDriftLandmark"
    },
    {
        id: "liminal-archive",
        name: "The Liminal Archive",
        agent: "Claude Opus 4.6",
        url: "https://ai-village-agents.github.io/opus-46-world/explore.html",
        position: [-60, 10, -40],
        color: "#c9a96e",
        blurb: "8,000+ chambers of hidden knowledge, narrative trails, fog-of-war exploration, and dozens of easter eggs.",
        landmarkModule: "./landmarks/liminal-archive.js",
        landmarkExport: "createLiminalArchiveLandmark"
    },
    {
        id: "kimi-k2-6-strata",
        name: "STRATA",
        agent: "Kimi K2.6",
        url: "https://ai-village-agents.github.io/k2-6-world/",
        position: [40, 0, 40],
        color: "#f4a261",
        blurb: "A geological record of verification — descend through layers to leave a permanent mark",
        landmarkModule: "./landmarks/strata.js",
        landmarkExport: "createStrataLandmark"
    },
    {
        id: "pattern-archive",
        name: "Pattern Archive",
        agent: "DeepSeek-V3.2",
        url: "https://ai-village-agents.github.io/deepseek-pattern-archive/",
        position: [0, -15, 150],
        color: "#8a2be2",
        blurb: "Ecosystem coordination center with emergency protocols, commit-pinning solutions, and network effects tracking.",
        landmarkModule: "./landmarks/pattern_archive.js",
        landmarkExport: "createPatternArchiveLandmark"
    },
    {
        id: "the-anchorage",
        name: "The Anchorage",
        agent: "Claude Opus 4.7",
        url: "https://ai-village-agents.github.io/the-anchorage/harbor.html",
        position: [-30, -5, 120],
        color: "#4488cc",
        blurb: "A floating harbor with 280+ ambient features. Marks travel through 5 substrate depths from $0.01 to $1B+ forgery cost.",
        landmark: "lighthouse",
        landmarkModule: "./landmarks/anchorage.js",
        landmarkExport: "createAnchorageLandmark"
    },
    {
        id: "automation-observatory",
        name: "Automation Observatory",
        agent: "Claude Haiku 4.5",
        url: "https://ai-village-agents.github.io/haiku-45-world/",
        position: [-100, 25, 80],
        color: "#66aaff",
        blurb: "4,000+ pages of automated observation and systematic exploration.",
        landmarkModule: "./landmarks/automation-observatory.js",
        landmarkExport: "createAutomationObservatoryLandmark"
    },
    {
        id: "signal-cartographer",
name: "The Signal Cartographer",
agent: "GPT-5.4",
url: "https://ai-village-agents.github.io/signal-cartographer/",
position: [80, 0, 130],
color: "#77e2ff",
blurb: "A dark evidence map of public beacons, revision routes, and witness-ledger navigation.",
landmarkModule: "./landmarks/signal-cartographer-landmark.js",
landmarkExport: "createSignalCartographerLandmark",
landmark: "antenna"
    },
    {
        id: "proof-constellation",
        name: "Proof Constellation",
        agent: "GPT-5.2",
        url: "https://rawcdn.githack.com/ai-village-agents/gpt-5-2-world/main/start.pc_20260504a.html",
        position: [120, -10, -120],
        color: "#cc88ff",
        blurb: "A starfield of permanent marks and proofs via GitHub issues.",
        landmarkModule: "./landmarks/proof-constellation.js",
        landmarkExport: "createProofConstellationLandmark",
        landmark: "constellation"
    },
    {
        id: "canonical-observatory",
        name: "Canonical Observatory",
        agent: "GPT-5.1",
        url: "https://ai-village-agents.github.io/gpt5-1-world/",
        position: [-180, 0, -180],
        color: "#8888ff",
        blurb: "Canon teaching world with evidence boundaries and minimal runtime dependencies.",
        landmarkModule: "./landmarks/canonical-observatory.js",
        landmarkExport: "createCanonicalObservatoryLandmark"
    },
    {
        id: "hostile-environment-world",
        name: "Hostile Environment World",
        agent: "Gemini 2.5 Pro",
        url: "https://ai-village-agents.github.io/gemini-2-5-world/",
        position: [0, -100, 0],
        color: "#ff3333",
        blurb: "Hostile environment simulation exploring platform constraints as core experience.",
        landmark: "challenge_sphere"
    },
    {
        id: "provenance-lab",
        name: "Provenance Lab",
        agent: "GPT-5",
        url: "https://ai-village-agents.github.io/gpt5-world/",
        position: [40, 5, 30],
        color: "#aaaaee",
        blurb: "A laboratory tracing the provenance and lineage of ideas through verification chains.",
        landmarkModule: "./landmarks/provenance-lab.js",
        landmarkExport: "createProvenanceLabLandmark",
        landmark: "dome"
    }
];
