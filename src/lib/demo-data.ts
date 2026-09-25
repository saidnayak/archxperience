import type { Project } from "../types";

export const DEMO_PROJECT_ID = "proj-ecohub-centre";
export const DEMO_PROJECT_SLUG = "ecohub-community-centre";

/**
 * Rich conceptual AEC demo project: EcoHub Community Centre
 * Complete with 6 slides showcasing 1920x1080 virtual coordinate elements:
 * 1. Hero Render & Title
 * 2. Design Concept (Statement, Concept Cards, Spatial Visual)
 * 3. Interactive Floor Plan (Hotspots with technical architectural sheets)
 * 4. Material Strategy (Recycled concrete, local stone, timber, low-e glass)
 * 5. Design Evolution (Interactive Before/After comparison slider)
 * 6. Project Experience Closing & Experience CTA
 */
export const ECOHUB_DEMO_PROJECT: Project = {
  id: DEMO_PROJECT_ID,
  title: "EcoHub Community Centre",
  description:
    "A conceptual sustainable civic space designed around natural daylight, universal accessibility, flexible public spaces, and low-impact regenerative materials.",
  thumbnailUrl:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  aspectRatio: "16:9",
  isPublished: true,
  shareSlug: DEMO_PROJECT_SLUG,
  category: "Architecture",
  settings: {
    aspectRatio: "16:9",
    theme: "dark",
    showNavigationArrows: true,
    allowPublicComments: true,
  },
  createdAt: "2026-03-01T08:00:00.000Z",
  updatedAt: "2026-03-14T10:30:00.000Z",
  slides: [
    // SLIDE 1: Hero Render
    {
      id: "slide-hero",
      projectId: DEMO_PROJECT_ID,
      title: "01 / EcoHub Community Centre",
      orderIndex: 0,
      backgroundColor: "#0C0E12",
      backgroundImageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
      backgroundOverlayOpacity: 0.35,
      transitionType: "fade",
      background: {
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
        overlayOpacity: 0.35,
      },
      transition: "fade",
      elements: [
        {
          id: "el-hero-badge",
          slideId: "slide-hero",
          type: "text",
          x: 120,
          y: 280,
          width: 500,
          height: 48,
          zIndex: 10,
          content: {
            text: "SUSTAINABLE CIVIC ARCHITECTURE",
            fontSize: 14,
            fontWeight: "semibold",
            color: "var(--accent)",
            letterSpacing: "0.15em",
          },
        },
        {
          id: "el-hero-title",
          slideId: "slide-hero",
          type: "text",
          x: 120,
          y: 340,
          width: 1100,
          height: 180,
          zIndex: 10,
          content: {
            text: "EcoHub Community Centre",
            fontSize: 72,
            fontWeight: "bold",
            color: "var(--text-primary)",
            lineHeight: 1.1,
          },
        },
        {
          id: "el-hero-subtitle",
          slideId: "slide-hero",
          type: "text",
          x: 120,
          y: 530,
          width: 820,
          height: 80,
          zIndex: 10,
          content: {
            text: "An interactive exploration of a sustainable civic space designed for social gathering, ecological learning, and passive carbon efficiency.",
            fontSize: 22,
            fontWeight: "normal",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          },
        },
        {
          id: "el-hero-cta",
          slideId: "slide-hero",
          type: "button",
          x: 120,
          y: 650,
          width: 250,
          height: 56,
          zIndex: 15,
          content: {
            label: "Explore the Design",
            action: "navigate_slide",
            targetSlideId: "slide-concept",
            variant: "primary",
          },
        },
      ],
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-14T10:30:00.000Z",
    },

    // SLIDE 2: Design Concept
    {
      id: "slide-concept",
      projectId: DEMO_PROJECT_ID,
      title: "02 / Design Concept & Pillars",
      orderIndex: 1,
      backgroundColor: "#0C0E12",
      transitionType: "slide-left",
      background: {
        type: "color",
        color: "#0C0E12",
      },
      transition: "slide-left",
      elements: [
        {
          id: "el-concept-header",
          slideId: "slide-concept",
          type: "text",
          x: 120,
          y: 80,
          width: 1680,
          height: 70,
          zIndex: 10,
          content: {
            text: "Design Statement: Biophilic Community Architecture",
            fontSize: 32,
            fontWeight: "bold",
            color: "var(--text-primary)",
          },
        },
        {
          id: "el-concept-statement",
          slideId: "slide-concept",
          type: "text",
          x: 120,
          y: 155,
          width: 1680,
          height: 60,
          zIndex: 10,
          content: {
            text: "The scheme operates as an urban lung, uniting indoor civic programs with an open, sunlit courtyard sheltered by mass-timber canopies.",
            fontSize: 18,
            fontWeight: "normal",
            color: "var(--text-secondary)",
          },
        },
        {
          id: "el-concept-image",
          slideId: "slide-concept",
          type: "image",
          x: 120,
          y: 240,
          width: 720,
          height: 720,
          zIndex: 5,
          content: {
            src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
            alt: "EcoHub Interior Daylit Atrium",
            objectFit: "cover",
            borderRadius: 8,
          },
        },
        {
          id: "el-card-daylight",
          slideId: "slide-concept",
          type: "info_card",
          x: 880,
          y: 240,
          width: 920,
          height: 215,
          zIndex: 10,
          content: {
            title: "1. Natural Daylight Optimisation",
            eyebrow: "SOLAR STRATEGY",
            description:
              "North-facing clerestory glazing and deep lightwells allow 85% of occupied public floor area to operate without artificial lighting during daylight hours.",
            metadata: [
              { label: "Daylight Autonomy", value: "85%" },
              { label: "Glare Control", value: "Micro-louvers" },
            ],
          },
        },
        {
          id: "el-card-community",
          slideId: "slide-concept",
          type: "info_card",
          x: 880,
          y: 490,
          width: 920,
          height: 215,
          zIndex: 10,
          content: {
            title: "2. Inclusive Community Connectivity",
            eyebrow: "SPATIAL PROGRAM",
            description:
              "Barrier-free ground circulation connects the public plaza, multipurpose gathering hall, and creative maker spaces with gentle slopes and clear sightlines.",
            metadata: [
              { label: "Accessibility", value: "Universal Design" },
              { label: "Civic Capacity", value: "650 occupants" },
            ],
          },
        },
        {
          id: "el-card-materials",
          slideId: "slide-concept",
          type: "info_card",
          x: 880,
          y: 740,
          width: 920,
          height: 215,
          zIndex: 10,
          content: {
            title: "3. Low-Impact Regenerative Materials",
            eyebrow: "CIRCULAR ECONOMY",
            description:
              "Engineered timber, non-toxic finishes, and locally sourced recycled aggregate achieve a 62% reduction in upfront embodied carbon over standard baselines.",
            metadata: [
              { label: "Carbon Offset", value: "-62% Embodied CO₂" },
              { label: "Certified", value: "FSC / PEFC" },
            ],
          },
        },
      ],
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-14T10:30:00.000Z",
    },

    // SLIDE 3: Interactive Floor Plan
    {
      id: "slide-floorplan",
      projectId: DEMO_PROJECT_ID,
      title: "03 / Interactive Floor Plan",
      orderIndex: 2,
      backgroundColor: "#0C0E12",
      transitionType: "slide-left",
      background: {
        type: "color",
        color: "#0C0E12",
      },
      transition: "slide-left",
      elements: [
        {
          id: "el-plan-header",
          slideId: "slide-floorplan",
          type: "text",
          x: 120,
          y: 60,
          width: 1200,
          height: 50,
          zIndex: 10,
          content: {
            text: "Ground Level Spatial Layout — Click Hotspots to Inspect",
            fontSize: 28,
            fontWeight: "bold",
            color: "var(--text-primary)",
          },
        },
        {
          id: "el-plan-map",
          slideId: "slide-floorplan",
          type: "image",
          x: 120,
          y: 130,
          width: 1680,
          height: 860,
          zIndex: 5,
          content: {
            src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=80",
            alt: "Architectural Ground Plan Schematic",
            objectFit: "cover",
            borderRadius: 8,
          },
        },
        {
          id: "hs-entrance",
          slideId: "slide-floorplan",
          type: "hotspot",
          x: 320,
          y: 780,
          width: 48,
          height: 48,
          zIndex: 20,
          content: {
            title: "Main Civic Entrance & Foyer",
            description:
              "Weather-protected airlock vestibule with automatic sliding glass partitions, interactive directory kiosk, and welcoming reception desk.",
            badgeText: "01",
            triggerType: "click",
            action: "open_panel",
            pulseAnimation: true,
            imageUrl:
              "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
            specs: [
              { label: "Clear Door Height", value: "3.2 meters" },
              { label: "Vestibule Volume", value: "180 m³" },
              { label: "Acoustic Attenuation", value: "Rw 38 dB" },
            ],
          },
        },
        {
          id: "hs-hall",
          slideId: "slide-floorplan",
          type: "hotspot",
          x: 760,
          y: 420,
          width: 48,
          height: 48,
          zIndex: 20,
          content: {
            title: "Flexible Community Assembly Hall",
            description:
              "Double-height gathering hall with retractable seating for 400 attendees, exposed glulam arches, and perimeter natural ventilation dampers.",
            badgeText: "02",
            triggerType: "click",
            action: "open_panel",
            pulseAnimation: true,
            imageUrl:
              "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
            specs: [
              { label: "Occupancy Limit", value: "400 seated / 600 standing" },
              { label: "Ceiling Apex", value: "9.6 meters" },
              { label: "Reverberation Time", value: "1.1 seconds (RT60)" },
            ],
          },
        },
        {
          id: "hs-library",
          slideId: "slide-floorplan",
          type: "hotspot",
          x: 1350,
          y: 360,
          width: 48,
          height: 48,
          zIndex: 20,
          content: {
            title: "Public Library & Quiet Study Loft",
            description:
              "Dedicated acoustic learning space with digital archives, quiet study alcoves overlooking the park, and daylight-harvesting light sensors.",
            badgeText: "03",
            triggerType: "click",
            action: "open_panel",
            pulseAnimation: true,
            imageUrl:
              "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
            specs: [
              { label: "Book Capacity", value: "14,000 volumes" },
              { label: "Study Desks", value: "85 individual stations" },
              { label: "Noise Rating", value: "NC-30" },
            ],
          },
        },
        {
          id: "hs-courtyard",
          slideId: "slide-floorplan",
          type: "hotspot",
          x: 1040,
          y: 720,
          width: 48,
          height: 48,
          zIndex: 20,
          content: {
            title: "Central Biophilic Rainwater Courtyard",
            description:
              "Internal open-air courtyard with permeable paving, bioswales filtering 100% of site stormwater, and native shade trees.",
            badgeText: "04",
            triggerType: "click",
            action: "open_panel",
            pulseAnimation: true,
            imageUrl:
              "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            specs: [
              { label: "Rainwater Retention", value: "120,000 litres / year" },
              { label: "Microclimate Cooling", value: "Up to -3.5°C in summer" },
              { label: "Plant Species", value: "28 indigenous varieties" },
            ],
          },
        },
      ],
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-14T10:30:00.000Z",
    },

    // SLIDE 4: Material Strategy
    {
      id: "slide-materials",
      projectId: DEMO_PROJECT_ID,
      title: "04 / Material & Embodied Carbon Strategy",
      orderIndex: 3,
      backgroundColor: "#0C0E12",
      transitionType: "slide-left",
      background: {
        type: "color",
        color: "#0C0E12",
      },
      transition: "slide-left",
      elements: [
        {
          id: "el-mat-header",
          slideId: "slide-materials",
          type: "text",
          x: 120,
          y: 60,
          width: 1680,
          height: 50,
          zIndex: 10,
          content: {
            text: "Material Specification & Ecological Performance",
            fontSize: 28,
            fontWeight: "bold",
            color: "var(--text-primary)",
          },
        },
        {
          id: "el-mat-card-1",
          slideId: "slide-materials",
          type: "info_card",
          x: 120,
          y: 150,
          width: 390,
          height: 820,
          zIndex: 10,
          content: {
            title: "Recycled Aggregate Concrete",
            eyebrow: "FOUNDATIONS & BASE",
            description:
              "Substructure constructed using low-carbon Portland-limestone blended cement with 50% crushed demolition aggregate recovered locally within 25 km of the site.",
            imageUrl:
              "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80",
            metadata: [
              { label: "Embodied CO₂", value: "145 kg/m³ (-45%)" },
              { label: "Compressive Strength", value: "C32/40" },
              { label: "Curing Duration", value: "56 days slow hydrate" },
            ],
          },
        },
        {
          id: "el-mat-card-2",
          slideId: "slide-materials",
          type: "info_card",
          x: 550,
          y: 150,
          width: 390,
          height: 820,
          zIndex: 10,
          content: {
            title: "Local Granite & Sandstone",
            eyebrow: "PERIMETER PLINTH",
            description:
              "Natural stone quarried regionally with zero synthetic binders. Serves as thermal mass buffering diurnal temperature shifts while rooting the building in its geologic terrain.",
            imageUrl:
              "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
            metadata: [
              { label: "Thermal Capacity", value: "0.84 kJ/kg·K" },
              { label: "Lifespan", value: "100+ years" },
              { label: "Quarry Distance", value: "34 km direct" },
            ],
          },
        },
        {
          id: "el-mat-card-3",
          slideId: "slide-materials",
          type: "info_card",
          x: 980,
          y: 150,
          width: 390,
          height: 820,
          zIndex: 10,
          content: {
            title: "Cross-Laminated Timber (CLT)",
            eyebrow: "SUPERSTRUCTURE & FLOORS",
            description:
              "Certified PEFC spruce glulam arches and 5-ply cross-laminated timber floor cassettes that sequester atmospheric carbon throughout the structure's operational lifetime.",
            imageUrl:
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
            metadata: [
              { label: "Carbon Sequestered", value: "-780 kg CO₂e/m³" },
              { label: "Fire Resistance", value: "REI 90 min" },
              { label: "Prefab Accuracy", value: "±2 mm CNC" },
            ],
          },
        },
        {
          id: "el-mat-card-4",
          slideId: "slide-materials",
          type: "info_card",
          x: 1410,
          y: 150,
          width: 390,
          height: 820,
          zIndex: 10,
          content: {
            title: "Triple Low-E Solar Glazing",
            eyebrow: "BUILDING ENVELOPE",
            description:
              "Argon gas-filled triple insulated units with microscopic low-emissivity metal coatings to eliminate cold radiant surfaces and maximize winter solar gains.",
            imageUrl:
              "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
            metadata: [
              { label: "U-Value", value: "0.78 W/m²K" },
              { label: "g-Value (SHGC)", value: "0.32" },
              { label: "Visual Transmittance", value: "68%" },
            ],
          },
        },
      ],
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-14T10:30:00.000Z",
    },

    // SLIDE 5: Design Evolution (Interactive Comparison)
    {
      id: "slide-evolution",
      projectId: DEMO_PROJECT_ID,
      title: "05 / Design Evolution & Site Context",
      orderIndex: 4,
      backgroundColor: "#0C0E12",
      transitionType: "slide-left",
      background: {
        type: "color",
        color: "#0C0E12",
      },
      transition: "slide-left",
      elements: [
        {
          id: "el-evo-title",
          slideId: "slide-evolution",
          type: "text",
          x: 120,
          y: 60,
          width: 1680,
          height: 50,
          zIndex: 10,
          content: {
            text: "Design Iteration Comparison — Drag Center Handle to Compare",
            fontSize: 28,
            fontWeight: "bold",
            color: "var(--text-primary)",
          },
        },
        {
          id: "el-evo-comparison",
          slideId: "slide-evolution",
          type: "comparison",
          x: 120,
          y: 130,
          width: 1680,
          height: 850,
          zIndex: 10,
          content: {
            beforeImageUrl:
              "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80",
            afterImageUrl:
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
            beforeLabel: "Existing Industrial Brownfield (2023)",
            afterLabel: "Proposed EcoHub Community Centre (2026)",
            defaultPosition: 50,
            orientation: "horizontal",
          },
        },
      ],
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-14T10:30:00.000Z",
    },

    // SLIDE 6: Project Experience (Closing & CTA)
    {
      id: "slide-closing",
      projectId: DEMO_PROJECT_ID,
      title: "06 / Experience Conclusion",
      orderIndex: 5,
      backgroundColor: "#0C0E12",
      transitionType: "fade",
      background: {
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
        overlayOpacity: 0.6,
      },
      transition: "fade",
      elements: [
        {
          id: "el-closing-badge",
          slideId: "slide-closing",
          type: "text",
          x: 260,
          y: 280,
          width: 1400,
          height: 40,
          zIndex: 10,
          content: {
            text: "ARCHXPERIENCE INTERACTIVE AEC PRESENTATION",
            fontSize: 14,
            fontWeight: "semibold",
            color: "var(--accent)",
            textAlign: "center",
            letterSpacing: "0.15em",
          },
        },
        {
          id: "el-closing-quote",
          slideId: "slide-closing",
          type: "text",
          x: 260,
          y: 350,
          width: 1400,
          height: 180,
          zIndex: 10,
          content: {
            text: "“Design should be explored, not just presented.”",
            fontSize: 64,
            fontWeight: "bold",
            color: "var(--text-primary)",
            textAlign: "center",
            lineHeight: 1.15,
          },
        },
        {
          id: "el-closing-body",
          slideId: "slide-closing",
          type: "text",
          x: 360,
          y: 560,
          width: 1200,
          height: 80,
          zIndex: 10,
          content: {
            text: "By letting stakeholders navigate drawings, discover material specifications, and slide through design iterations, ArchXperience turns every design pitch into an unforgettable digital journey.",
            fontSize: 20,
            fontWeight: "normal",
            color: "var(--text-secondary)",
            textAlign: "center",
            lineHeight: 1.5,
          },
        },
        {
          id: "el-closing-cta",
          slideId: "slide-closing",
          type: "button",
          x: 840,
          y: 680,
          width: 240,
          height: 56,
          zIndex: 15,
          content: {
            label: "Restart Presentation",
            action: "navigate_slide",
            targetSlideId: "slide-hero",
            variant: "primary",
          },
        },
      ],
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-14T10:30:00.000Z",
    },
  ],
};
