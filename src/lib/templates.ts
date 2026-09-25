import type { Slide, CanvasElement } from "../types";
import { ECOHUB_DEMO_PROJECT } from "./demo-data";

export interface ProjectTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  slideCount: number;
  tags: string[];
  createSlides: (projectId: string) => Slide[];
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank Experience",
    category: "Custom",
    description: "A clean 16:9 canvas ready for custom layouts, architectural typography, and interactive components.",
    thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    slideCount: 1,
    tags: ["Minimal", "16:9", "Custom"],
    createSlides: (projectId: string): Slide[] => {
      const slideId = `slide-${Date.now()}-1`;
      const now = new Date().toISOString();
      return [
        {
          id: slideId,
          projectId,
          title: "Untitled Slide",
          orderIndex: 0,
          backgroundColor: "#0C0E12",
          transitionType: "fade",
          background: { type: "color", color: "#0C0E12" },
          elements: [],
          createdAt: now,
          updatedAt: now,
        },
      ];
    },
  },
  {
    id: "aec-starter",
    name: "AEC Project Starter",
    category: "Architecture",
    description: "Comprehensive architectural framework featuring title hero, concept pillars, floor plan hotspots, material specs, and before/after comparison.",
    thumbnailUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    slideCount: 6,
    tags: ["Architecture", "Hotspots", "Comparison", "Materials"],
    createSlides: (projectId: string): Slide[] => {
      const now = new Date().toISOString();
      // Clone EcoHub structure with fresh IDs mapped to new projectId
      const slideIdMap = new Map<string, string>();
      ECOHUB_DEMO_PROJECT.slides.forEach((s) => {
        slideIdMap.set(s.id, `slide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
      });

      return ECOHUB_DEMO_PROJECT.slides.map((s) => {
        const newSlideId = slideIdMap.get(s.id)!;
        return {
          ...s,
          id: newSlideId,
          projectId,
          elements: s.elements.map((el) => {
            const newElId = `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const updatedContent = { ...el.content };
            if (
              "targetSlideId" in updatedContent &&
              updatedContent.targetSlideId &&
              slideIdMap.has(updatedContent.targetSlideId)
            ) {
              updatedContent.targetSlideId = slideIdMap.get(updatedContent.targetSlideId);
            }
            return {
              ...el,
              id: newElId,
              slideId: newSlideId,
              content: updatedContent,
            } as CanvasElement;
          }),
          createdAt: now,
          updatedAt: now,
        };
      });
    },
  },
  {
    id: "case-study",
    name: "Architecture Case Study",
    category: "Architecture",
    description: "Compact 3-slide editorial presentation highlighting site context, building envelope specification, and completion visual.",
    thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    slideCount: 3,
    tags: ["Editorial", "Specifications", "Case Study"],
    createSlides: (projectId: string): Slide[] => {
      const now = new Date().toISOString();
      const s1Id = `slide-${Date.now()}-1`;
      const s2Id = `slide-${Date.now()}-2`;
      const s3Id = `slide-${Date.now()}-3`;

      return [
        {
          id: s1Id,
          projectId,
          title: "01 / Project Overview",
          orderIndex: 0,
          backgroundColor: "#0C0E12",
          backgroundImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80",
          backgroundOverlayOpacity: 0.4,
          transitionType: "fade",
          background: { type: "image", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80", overlayOpacity: 0.4 },
          elements: [
            {
              id: `el-${Date.now()}-1`,
              slideId: s1Id,
              type: "text",
              x: 160,
              y: 360,
              width: 1200,
              height: 120,
              zIndex: 10,
              content: { text: "Urban Cultural Pavilion", fontSize: 64, fontWeight: "bold", color: "var(--text-primary)" },
            },
            {
              id: `el-${Date.now()}-2`,
              slideId: s1Id,
              type: "text",
              x: 160,
              y: 500,
              width: 900,
              height: 80,
              zIndex: 10,
              content: { text: "A high-performance timber and glass civic anchor celebrating public life.", fontSize: 22, color: "var(--text-secondary)" },
            },
            {
              id: `el-${Date.now()}-3`,
              slideId: s1Id,
              type: "button",
              x: 160,
              y: 620,
              width: 240,
              height: 56,
              zIndex: 15,
              content: { label: "Explore Case Study", action: "navigate_slide", targetSlideId: s2Id, variant: "primary" },
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: s2Id,
          projectId,
          title: "02 / Architectural Enclosure",
          orderIndex: 1,
          backgroundColor: "#0C0E12",
          transitionType: "slide-left",
          background: { type: "color", color: "#0C0E12" },
          elements: [
            {
              id: `el-${Date.now()}-4`,
              slideId: s2Id,
              type: "text",
              x: 120,
              y: 80,
              width: 1680,
              height: 50,
              zIndex: 10,
              content: { text: "Façade Engineering & Envelope Performance", fontSize: 32, fontWeight: "bold", color: "var(--text-primary)" },
            },
            {
              id: `el-${Date.now()}-5`,
              slideId: s2Id,
              type: "image",
              x: 120,
              y: 160,
              width: 960,
              height: 780,
              zIndex: 5,
              content: { src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80", alt: "Atrium Façade Detail", objectFit: "cover", borderRadius: 8 },
            },
            {
              id: `el-${Date.now()}-6`,
              slideId: s2Id,
              type: "info_card",
              x: 1120,
              y: 160,
              width: 680,
              height: 780,
              zIndex: 10,
              content: {
                title: "Glulam & Triple-Glazed System",
                eyebrow: "TECHNICAL SPECIFICATION",
                description: "Thermally broken spruce mullions support custom argon-filled low-E insulated glass units designed to withstand 1.4 kPa wind loading while providing daylight autonomy of 78%.",
                metadata: [
                  { label: "Thermal Transmittance", value: "U = 0.76 W/m²K" },
                  { label: "Solar Factor (g)", value: "0.29" },
                  { label: "Sound Insulation", value: "Rw 45 dB" },
                  { label: "Embodied Carbon", value: "-340 kg CO₂e/m³" },
                ],
              },
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: s3Id,
          projectId,
          title: "03 / Spatial Experience",
          orderIndex: 2,
          backgroundColor: "#0C0E12",
          transitionType: "slide-left",
          background: { type: "color", color: "#0C0E12" },
          elements: [
            {
              id: `el-${Date.now()}-7`,
              slideId: s3Id,
              type: "text",
              x: 120,
              y: 80,
              width: 1680,
              height: 50,
              zIndex: 10,
              content: { text: "Interactive Spatial Callouts — Click Points to Review", fontSize: 32, fontWeight: "bold", color: "var(--text-primary)" },
            },
            {
              id: `el-${Date.now()}-8`,
              slideId: s3Id,
              type: "image",
              x: 120,
              y: 160,
              width: 1680,
              height: 780,
              zIndex: 5,
              content: { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80", alt: "Civic Pavilion Atrium", objectFit: "cover", borderRadius: 8 },
            },
            {
              id: `el-${Date.now()}-9`,
              slideId: s3Id,
              type: "hotspot",
              x: 640,
              y: 520,
              width: 48,
              height: 48,
              zIndex: 20,
              content: {
                title: "Mass-Timber Skylight Oculus",
                description: "Central 6-meter diameter oculus directing diffuse southern skylight across public circulation galleries.",
                badgeText: "01",
                action: "open_panel",
                pulseAnimation: true,
                specs: [
                  { label: "Aperture Diameter", value: "6.2 meters" },
                  { label: "Framing System", value: "Glulam Ring Beam" },
                ],
              },
            },
            {
              id: `el-${Date.now()}-10`,
              slideId: s3Id,
              type: "hotspot",
              x: 1280,
              y: 640,
              width: 48,
              height: 48,
              zIndex: 20,
              content: {
                title: "Acoustic Timber Wall Slats",
                description: "Perforated European Oak wall cladding backed with recycled textile sound absorption battens.",
                badgeText: "02",
                action: "open_panel",
                pulseAnimation: true,
                specs: [
                  { label: "Absorption Class", value: "Class A" },
                  { label: "Timber Species", value: "PEFC European Oak" },
                ],
              },
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ];
    },
  },
  {
    id: "before-after",
    name: "Before / After Concept",
    category: "Urban Design",
    description: "Focuses on adaptive reuse and renovation comparisons with interactive before/after split sliders.",
    thumbnailUrl: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    slideCount: 2,
    tags: ["Comparison", "Urban Design", "Renovation"],
    createSlides: (projectId: string): Slide[] => {
      const now = new Date().toISOString();
      const s1Id = `slide-${Date.now()}-1`;
      const s2Id = `slide-${Date.now()}-2`;

      return [
        {
          id: s1Id,
          projectId,
          title: "01 / Site Transformation Context",
          orderIndex: 0,
          backgroundColor: "#0C0E12",
          backgroundImageUrl: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80",
          backgroundOverlayOpacity: 0.5,
          transitionType: "fade",
          background: { type: "image", imageUrl: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80", overlayOpacity: 0.5 },
          elements: [
            {
              id: `el-${Date.now()}-1`,
              slideId: s1Id,
              type: "text",
              x: 160,
              y: 360,
              width: 1400,
              height: 120,
              zIndex: 10,
              content: { text: "Brownfield Rehabilitation Study", fontSize: 64, fontWeight: "bold", color: "var(--text-primary)" },
            },
            {
              id: `el-${Date.now()}-2`,
              slideId: s1Id,
              type: "text",
              x: 160,
              y: 500,
              width: 1100,
              height: 80,
              zIndex: 10,
              content: { text: "Comparative analysis of obsolete industrial parcel converted into a community park and civic hub.", fontSize: 22, color: "var(--text-secondary)" },
            },
            {
              id: `el-${Date.now()}-3`,
              slideId: s1Id,
              type: "button",
              x: 160,
              y: 620,
              width: 260,
              height: 56,
              zIndex: 15,
              content: { label: "View Iteration Slider", action: "navigate_slide", targetSlideId: s2Id, variant: "primary" },
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: s2Id,
          projectId,
          title: "02 / Before & After Interactive Comparison",
          orderIndex: 1,
          backgroundColor: "#0C0E12",
          transitionType: "slide-left",
          background: { type: "color", color: "#0C0E12" },
          elements: [
            {
              id: `el-${Date.now()}-4`,
              slideId: s2Id,
              type: "text",
              x: 120,
              y: 60,
              width: 1680,
              height: 50,
              zIndex: 10,
              content: { text: "Site Evolution — Drag the Divider to Compare Existing vs Proposed Intervention", fontSize: 28, fontWeight: "bold", color: "var(--text-primary)" },
            },
            {
              id: `el-${Date.now()}-5`,
              slideId: s2Id,
              type: "comparison",
              x: 120,
              y: 130,
              width: 1680,
              height: 850,
              zIndex: 10,
              content: {
                beforeImageUrl: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80",
                afterImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
                beforeLabel: "Existing Industrial Parcel (2023)",
                afterLabel: "Proposed Civic Architecture (2026)",
                defaultPosition: 50,
                orientation: "horizontal",
              },
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ];
    },
  },
];
