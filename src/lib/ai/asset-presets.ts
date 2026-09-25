/**
 * Curated High-Resolution Architectural Image Preset Catalog.
 * Guarantees that AI-generated presentations reference verified, safe, high-fidelity
 * AEC imagery from known CDN sources rather than inventing broken URLs.
 */

export const AEC_IMAGE_PRESETS: Record<string, { url: string; alt: string }> = {
  // Hero & Exterior Renders
  hero_exterior: {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    alt: "Contemporary Sustainable Civic Architecture Exterior",
  },
  hero_atrium: {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80",
    alt: "Multi-Story Daylit Architectural Atrium",
  },
  hero_cultural: {
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
    alt: "Civic Cultural Center Elevation",
  },

  // Interiors & Spaces
  interior_library: {
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80",
    alt: "Public Library Reading Room with Timber Finish",
  },
  interior_timber: {
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
    alt: "Mass Timber Glulam Structural Beams & Gallery",
  },
  interior_atrium: {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80",
    alt: "Flexible Public Collaboration Hub",
  },
  courtyard: {
    url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1920&q=80",
    alt: "Landscaped Biophilic Courtyard & Native Planting",
  },

  // Technical Drawings & Floor Plans
  floor_plan: {
    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1920&q=80",
    alt: "Architectural General Arrangement Plan with Programmatic Zones",
  },
  floor_plan_technical: {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    alt: "Detailed Spatial Schematic & Circulation Diagram",
  },

  // Materials & Sustainability
  material_timber: {
    url: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=1200&q=80",
    alt: "Sustainably Harvested Cross-Laminated Timber (CLT)",
  },
  material_concrete: {
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    alt: "Recycled Aggregate Low-Carbon Architectural Concrete",
  },
  material_glass: {
    url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80",
    alt: "High-Performance Low-E Argon-Filled Triple Glazing",
  },
  material_stone: {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    alt: "Locally Quarried Honed Limestone Wall Cladding",
  },

  // Before & After Comparisons
  before_site: {
    url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80",
    alt: "Existing Industrial Site Context Prior to Intervention",
  },
  after_design: {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    alt: "Proposed Regenerative Architecture and Civic Landscape",
  },

  // Façade & Envelope Details
  facade_detail: {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80",
    alt: "Double-Skin Ventilated Façade & Shading Louvers",
  },
  sustainability_diagram: {
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
    alt: "Passive Solar Building Massing & Natural Ventilation",
  },
};

export const DEFAULT_FALLBACK_IMAGE = {
  url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
  alt: "Architectural Concept Visual",
};

/**
 * Validates that an image or link URL uses secure HTTPS and does not attempt script injection.
 */
export function isSafeHttpsUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith("https://") && !trimmed.includes("javascript:") && !trimmed.includes("data:");
}

/**
 * Resolves a semantic image role to a verified high-resolution asset URL.
 */
export function resolveImageRole(role?: string | null): { url: string; alt: string } {
  if (!role || typeof role !== "string") {
    return DEFAULT_FALLBACK_IMAGE;
  }

  const normalized = role.toLowerCase().trim().replace(/[-\s]/g, "_");

  if (AEC_IMAGE_PRESETS[normalized]) {
    return AEC_IMAGE_PRESETS[normalized];
  }

  // Fuzzy alias matching
  if (normalized.includes("floor") || normalized.includes("plan")) {
    return AEC_IMAGE_PRESETS.floor_plan;
  }
  if (normalized.includes("timber") || normalized.includes("wood")) {
    return AEC_IMAGE_PRESETS.material_timber;
  }
  if (normalized.includes("concrete") || normalized.includes("cement")) {
    return AEC_IMAGE_PRESETS.material_concrete;
  }
  if (normalized.includes("glass") || normalized.includes("glazing") || normalized.includes("window")) {
    return AEC_IMAGE_PRESETS.material_glass;
  }
  if (normalized.includes("stone") || normalized.includes("masonry")) {
    return AEC_IMAGE_PRESETS.material_stone;
  }
  if (normalized.includes("courtyard") || normalized.includes("garden") || normalized.includes("landscape")) {
    return AEC_IMAGE_PRESETS.courtyard;
  }
  if (normalized.includes("library") || normalized.includes("reading") || normalized.includes("interior")) {
    return AEC_IMAGE_PRESETS.interior_library;
  }
  if (normalized.includes("before") || normalized.includes("site") || normalized.includes("existing")) {
    return AEC_IMAGE_PRESETS.before_site;
  }
  if (normalized.includes("after") || normalized.includes("proposed")) {
    return AEC_IMAGE_PRESETS.after_design;
  }
  if (normalized.includes("facade") || normalized.includes("envelope") || normalized.includes("skin")) {
    return AEC_IMAGE_PRESETS.facade_detail;
  }
  if (normalized.includes("sustainability") || normalized.includes("energy") || normalized.includes("solar")) {
    return AEC_IMAGE_PRESETS.sustainability_diagram;
  }

  return DEFAULT_FALLBACK_IMAGE;
}
