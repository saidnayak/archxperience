import type { Project } from "../../types";
import type { IssueItem, AECChecklistItem } from "./intelligence-types";

/**
 * Calculates word count in a string
 */
function countWords(str?: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Checks if two bounding boxes intersect significantly (AABB)
 */
function checkAABBOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 8
): boolean {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX > padding && overlapY > padding;
}

/**
 * Runs 100% client-side deterministic quality and layout checks on a presentation.
 * Instant execution, 0 API calls, 0 network latency.
 */
export function runDeterministicReview(project: Project): {
  issues: IssueItem[];
  checklist: AECChecklistItem[];
} {
  const issues: IssueItem[] = [];
  const slideIdSet = new Set(project.slides.map((s) => s.id));
  const referencedSlideIds = new Set<string>();

  // 1. Deck Length Check
  if (project.slides.length < 3) {
    issues.push({
      id: "deck-length-short",
      title: "Deck Length Warning",
      message: `Presentation contains only ${project.slides.length} slides. An architectural narrative typically requires at least 4-6 slides to resolve context, concept, and technical execution.`,
      severity: "warning",
      category: "structure",
      source: "deterministic",
    });
  } else if (project.slides.length > 12) {
    issues.push({
      id: "deck-length-long",
      title: "Deck Length Suggestion",
      message: `Presentation contains ${project.slides.length} slides. Consider condensing to 6-8 key milestones to maximize audience engagement during client or jury pitches.`,
      severity: "suggestion",
      category: "structure",
      suggestedAction: "restructure_content",
      source: "deterministic",
    });
  }

  // Collect all referenced navigation targets
  project.slides.forEach((slide) => {
    slide.elements.forEach((el) => {
      if (el.type === "button" && el.content.action === "navigate_slide" && el.content.targetSlideId) {
        referencedSlideIds.add(el.content.targetSlideId);
      }
      if (el.type === "hotspot" && el.content.action === "navigate_slide" && el.content.targetSlideId) {
        referencedSlideIds.add(el.content.targetSlideId);
      }
    });
  });

  // 2. Per-Slide Analysis
  project.slides.forEach((slide, slideIdx) => {
    const slideNumber = slideIdx + 1;
    let slideTotalWords = 0;
    let hasFloorPlanOrDrawing = false;
    let hotspotCount = 0;
    let totalElementArea = 0;

    // Check slide title
    if (!slide.title || slide.title.trim() === "" || slide.title.toLowerCase().startsWith("untitled")) {
      issues.push({
        id: `slide-title-${slide.id}`,
        title: `Slide ${slideNumber} Missing Title`,
        message: `Slide ${slideNumber} has an untitled or placeholder title. Clear titles help orient reviewers and clients.`,
        severity: "warning",
        category: "structure",
        slideId: slide.id,
        slideIndex: slideIdx,
        source: "deterministic",
      });
    }

    // Orphan slide detection (excluding cover slide 0)
    if (slideIdx > 0 && !referencedSlideIds.has(slide.id) && project.slides.length > 4) {
      // Only a mild suggestion, as sequential navigation still reaches it
      // Don't flood issues if there are no navigation buttons at all
      if (referencedSlideIds.size > 0) {
        issues.push({
          id: `orphan-slide-${slide.id}`,
          title: `Slide ${slideNumber} Independent Navigation`,
          message: `Slide ${slideNumber} ("${slide.title}") is not directly linked from any overview buttons or floor plan hotspots. Consider adding a shortcut pin to improve discoverability.`,
          severity: "suggestion",
          category: "navigation",
          slideId: slide.id,
          slideIndex: slideIdx,
          suggestedAction: "add_hotspots",
          source: "deterministic",
        });
      }
    }

    // Inspect individual elements
    slide.elements.forEach((el) => {
      // Calculate canvas area footprint (excluding full-bleed visuals > 1200px)
      if (!(el.type === "image" && el.width >= 1600 && el.height >= 900)) {
        totalElementArea += el.width * el.height;
      }

      // Safe Margins Check (Canonical 1920x1080)
      // Exclude full-bleed background images and full-screen comparison sliders
      const isFullBleed = (el.type === "image" || el.type === "comparison") && el.width >= 1800;
      if (!isFullBleed) {
        if (el.x < 60 || el.x + el.width > 1860 || el.y < 60 || el.y + el.height > 1020) {
          issues.push({
            id: `safe-margin-${el.id}`,
            title: `Safe Margin Warning (Slide ${slideNumber})`,
            message: `Element "${el.type}" at (${el.x}, ${el.y}) extends too close to or beyond the 1920×1080 canvas safe boundary (margin safe zone: 60px padding).`,
            severity: "warning",
            category: "geometry",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: el.id,
            elementName: `${el.type.toUpperCase()} Element`,
            suggestedAction: "fix_overlap",
            source: "deterministic",
          });
        }
      }

      // Text Element Specifics
      if (el.type === "text") {
        const textContent = el.content.text || "";
        const words = countWords(textContent);
        slideTotalWords += words;

        // Empty text detection
        if (textContent.trim() === "") {
          issues.push({
            id: `empty-text-${el.id}`,
            title: `Empty Text Block (Slide ${slideNumber})`,
            message: `Text element on Slide ${slideNumber} contains no text content. Remove or populate with descriptive design information.`,
            severity: "warning",
            category: "text_density",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: el.id,
            elementName: "Empty Text",
            suggestedAction: "shorten_text",
            source: "deterministic",
          });
        }

        // Placeholder text detection
        const lower = textContent.toLowerCase();
        if (
          lower.includes("lorem ipsum") ||
          lower.includes("untitled") ||
          lower.includes("enter description") ||
          lower.includes("sample text") ||
          lower === "heading text"
        ) {
          issues.push({
            id: `placeholder-${el.id}`,
            title: `Placeholder Text Found (Slide ${slideNumber})`,
            message: `Element contains placeholder text ("${textContent.substring(0, 30)}..."). Replace with actual design narrative or spatial rationale.`,
            severity: "warning",
            category: "text_density",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: el.id,
            elementName: "Text Block",
            suggestedAction: "shorten_text",
            source: "deterministic",
          });
        }

        // Single text block density (>60 words)
        if (words > 60) {
          issues.push({
            id: `dense-text-${el.id}`,
            title: `Dense Paragraph Block (${words} words)`,
            message: `Text block on Slide ${slideNumber} has ${words} words. Long paragraphs are difficult to absorb in presentations; consider breaking into 2-3 architectural points or an Info Card.`,
            severity: "warning",
            category: "text_density",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: el.id,
            elementName: "Dense Text",
            suggestedAction: "shorten_text",
            source: "deterministic",
          });
        }

        // Font size hierarchy checks
        const fontSize = el.content.fontSize || 24;
        const isHeading =
          el.content.fontWeight === "bold" ||
          el.content.fontWeight === "semibold" ||
          (words <= 8 && el.y < 350);

        if (isHeading && fontSize < 28) {
          issues.push({
            id: `small-heading-${el.id}`,
            title: `Small Heading Font Size (${fontSize}px)`,
            message: `Slide heading font size (${fontSize}px) is below the recommended 28px architectural presentation minimum. Headings should anchor the visual hierarchy.`,
            severity: "warning",
            category: "visual_hierarchy",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: el.id,
            elementName: "Slide Heading",
            suggestedAction: "adjust_typography",
            source: "deterministic",
          });
        } else if (!isHeading && fontSize < 16) {
          issues.push({
            id: `small-font-${el.id}`,
            title: `Small Body Font Size (${fontSize}px)`,
            message: `Body text font size (${fontSize}px) is below the recommended 16px presentation minimum. Text may be unreadable on projection screens or laptops.`,
            severity: "warning",
            category: "visual_hierarchy",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: el.id,
            elementName: "Body Text",
            suggestedAction: "adjust_typography",
            source: "deterministic",
          });
        }
      }

      // Drawing / Floor Plan Heuristic
      if (el.type === "image") {
        const alt = (el.content.alt || "").toLowerCase();
        const caption = (el.content.caption || "").toLowerCase();
        const src = (el.content.src || "").toLowerCase();
        const slideTitleLower = slide.title.toLowerCase();

        if (
          alt.includes("plan") ||
          alt.includes("drawing") ||
          alt.includes("section") ||
          alt.includes("diagram") ||
          alt.includes("schematic") ||
          caption.includes("plan") ||
          caption.includes("layout") ||
          src.includes("floor") ||
          slideTitleLower.includes("plan") ||
          slideTitleLower.includes("spatial layout")
        ) {
          hasFloorPlanOrDrawing = true;
        }
      }

      // Hotspot count
      if (el.type === "hotspot") {
        hotspotCount++;

        // Hotspot target verification
        if (el.content.action === "navigate_slide" && el.content.targetSlideId) {
          if (!slideIdSet.has(el.content.targetSlideId)) {
            issues.push({
              id: `broken-hotspot-link-${el.id}`,
              title: `Broken Hotspot Navigation Link`,
              message: `Hotspot "${el.content.title}" on Slide ${slideNumber} points to a slide that has been deleted or does not exist.`,
              severity: "error",
              category: "navigation",
              slideId: slide.id,
              slideIndex: slideIdx,
              elementId: el.id,
              elementName: `Hotspot: ${el.content.title}`,
              source: "deterministic",
            });
          }
        }
      }

      // Button navigation verification
      if (el.type === "button") {
        if (el.content.action === "navigate_slide" && el.content.targetSlideId) {
          if (!slideIdSet.has(el.content.targetSlideId)) {
            issues.push({
              id: `broken-button-link-${el.id}`,
              title: `Broken Button Navigation Link`,
              message: `Button "${el.content.label}" on Slide ${slideNumber} points to a slide that no longer exists.`,
              severity: "error",
              category: "navigation",
              slideId: slide.id,
              slideIndex: slideIdx,
              elementId: el.id,
              elementName: `Button: ${el.content.label}`,
              source: "deterministic",
            });
          }
        }
      }
    });

    // Slide Total Text Density Check (>120 words)
    if (slideTotalWords > 120) {
      issues.push({
        id: `slide-words-high-${slide.id}`,
        title: `Slide ${slideNumber} Heavy Text Density (${slideTotalWords} words)`,
        message: `Slide ${slideNumber} contains ${slideTotalWords} words total. Architectural presentations should remain visual; consider condensing explanatory text or moving specs to Info Cards.`,
        severity: "warning",
        category: "text_density",
        slideId: slide.id,
        slideIndex: slideIdx,
        suggestedAction: "shorten_text",
        source: "deterministic",
      });
    }

    // Floor plan without hotspots check
    if (hasFloorPlanOrDrawing && hotspotCount === 0) {
      issues.push({
        id: `missing-hotspots-${slide.id}`,
        title: `Interactive Exploration Opportunity (Slide ${slideNumber})`,
        message: `Slide ${slideNumber} contains an architectural drawing/floor plan but has no interactive hotspots. Adding callouts allows reviewers to click and inspect key spatial dimensions.`,
        severity: "suggestion",
        category: "interactivity",
        slideId: slide.id,
        slideIndex: slideIdx,
        suggestedAction: "add_hotspots",
        source: "deterministic",
      });
    }

    // Canvas Overlap Detection (AABB)
    const elementsToTest = slide.elements.filter((el) => {
      // Skip hotspots (they intentionally sit on top of images)
      if (el.type === "hotspot") return false;
      // Skip full-bleed background images (they sit behind everything)
      if (el.type === "image" && el.width >= 1600 && el.height >= 900) return false;
      return true;
    });

    for (let i = 0; i < elementsToTest.length; i++) {
      for (let j = i + 1; j < elementsToTest.length; j++) {
        const elA = elementsToTest[i];
        const elB = elementsToTest[j];

        if (checkAABBOverlap(elA, elB)) {
          issues.push({
            id: `overlap-${elA.id}-${elB.id}`,
            title: `Element Collision Overlap (Slide ${slideNumber})`,
            message: `"${elA.type}" element overlaps with "${elB.type}" element on Slide ${slideNumber}. Content may be obscured or illegible.`,
            severity: "warning",
            category: "geometry",
            slideId: slide.id,
            slideIndex: slideIdx,
            elementId: elB.id,
            elementName: `${elA.type.toUpperCase()} / ${elB.type.toUpperCase()}`,
            suggestedAction: "fix_overlap",
            source: "deterministic",
          });
        }
      }
    }

    // Canvas Utilization Ratio
    const canvasArea = 1920 * 1080;
    const utilizationRatio = totalElementArea / canvasArea;
    if (slide.elements.length > 0 && utilizationRatio < 0.15) {
      issues.push({
        id: `low-utilization-${slide.id}`,
        title: `Low Canvas Utilization (Slide ${slideNumber})`,
        message: `Slide ${slideNumber} uses only ${Math.round(utilizationRatio * 100)}% of the canvas area. Consider scaling up visual assets or balancing spatial layout.`,
        severity: "suggestion",
        category: "visual_hierarchy",
        slideId: slide.id,
        slideIndex: slideIdx,
        source: "deterministic",
      });
    } else if (utilizationRatio > 0.75) {
      issues.push({
        id: `high-crowding-${slide.id}`,
        title: `Visual Crowding (Slide ${slideNumber})`,
        message: `Slide ${slideNumber} has ${Math.round(utilizationRatio * 100)}% element density. Generous negative space enhances architectural sophistication.`,
        severity: "suggestion",
        category: "visual_hierarchy",
        slideId: slide.id,
        slideIndex: slideIdx,
        source: "deterministic",
      });
    }
  });

  // 3. Final Slide CTA Check
  if (project.slides.length > 0) {
    const lastSlide = project.slides[project.slides.length - 1];
    const hasButton = lastSlide.elements.some((el) => el.type === "button");
    if (!hasButton) {
      issues.push({
        id: `missing-final-cta-${lastSlide.id}`,
        title: "Missing Closing Call-To-Action",
        message: `The concluding slide "${lastSlide.title}" contains no button elements. Including an interactive CTA (e.g., "Review Phasing" or "Explore Next Steps") improves presentation closure.`,
        severity: "suggestion",
        category: "interactivity",
        slideId: lastSlide.id,
        slideIndex: project.slides.length - 1,
        suggestedAction: "add_element",
        source: "deterministic",
      });
    }
  }

  // 4. Build Adaptive AEC Checklist (Category-Specific)
  const checklist = generateAdaptiveChecklist(project);

  return { issues, checklist };
}

/**
 * Builds category-tailored AEC Checklist verifying architectural milestones
 */
function generateAdaptiveChecklist(project: Project): AECChecklistItem[] {
  const category = (project.category || "Architecture").toLowerCase();
  const allText = project.slides
    .flatMap((s) => s.elements.map((el) => ("text" in el.content ? String(el.content.text) : "")))
    .join(" ")
    .toLowerCase();
  const allSlideTitles = project.slides.map((s) => s.title.toLowerCase()).join(" ");

  const hasHotspots = project.slides.some((s) => s.elements.some((el) => el.type === "hotspot"));
  const hasComparison = project.slides.some((s) => s.elements.some((el) => el.type === "comparison"));
  const hasInfoCards = project.slides.some((s) => s.elements.some((el) => el.type === "info_card"));
  const hasButtons = project.slides.some((s) => s.elements.some((el) => el.type === "button"));

  if (category.includes("interior")) {
    return [
      {
        category: "Interior Design",
        item: "Project Identity & Typology",
        status: project.title ? "pass" : "missing",
        notes: "Clear project naming, aesthetic tone, and spatial brief.",
      },
      {
        category: "Interior Design",
        item: "Spatial Concept & Mood",
        status: allSlideTitles.includes("concept") || allText.includes("concept") || allText.includes("mood") ? "pass" : "attention",
        notes: "Governing interior concept and experiential intent.",
      },
      {
        category: "Interior Design",
        item: "Material Palette & Textures",
        status: allText.includes("material") || hasInfoCards ? "pass" : "attention",
        notes: "Specified surfaces, textiles, and tactile materials.",
      },
      {
        category: "Interior Design",
        item: "Architectural Finishes",
        status: allText.includes("finish") || allText.includes("timber") || allText.includes("stone") ? "pass" : "attention",
        notes: "Flooring, wall finishes, joinery details, and hardware.",
      },
      {
        category: "Interior Design",
        item: "Lighting Strategy",
        status: allText.includes("light") || allText.includes("luminaire") ? "pass" : "attention",
        notes: "Integration of ambient, task, and architectural accent lighting.",
      },
      {
        category: "Interior Design",
        item: "FF&E Schedule",
        status: allText.includes("furniture") || allText.includes("ff&e") || hasHotspots ? "pass" : "missing",
        notes: "Loose furniture, custom joinery, and fixture specifications.",
      },
      {
        category: "Interior Design",
        item: "Acoustic Strategy",
        status: allText.includes("acoustic") || allText.includes("sound") || allText.includes("absorption") ? "pass" : "attention",
        notes: "Reverberation control, acoustic wall panels, and ceiling baffles.",
      },
      {
        category: "Interior Design",
        item: "Spatial Flow & Zoning",
        status: allSlideTitles.includes("plan") || allText.includes("circulation") || allText.includes("flow") ? "pass" : "attention",
        notes: "Circulation corridors, threshold transitions, and programmatic zoning.",
      },
      {
        category: "Interior Design",
        item: "Conclusion & Phasing",
        status: hasButtons ? "pass" : "attention",
        notes: "Concluding milestone with interactive next-step CTA.",
      },
    ];
  }

  if (category.includes("urban")) {
    return [
      {
        category: "Urban Design",
        item: "Urban Context & Morphology",
        status: allText.includes("context") || allText.includes("site") ? "pass" : "missing",
        notes: "City fabric, surrounding neighborhood linkages, and morphology.",
      },
      {
        category: "Urban Design",
        item: "Public Realm & Civic Space",
        status: allText.includes("public") || allText.includes("plaza") || allText.includes("civic") ? "pass" : "attention",
        notes: "Pedestrian plazas, streetscapes, and open civic spaces.",
      },
      {
        category: "Urban Design",
        item: "Mobility & Transit Networks",
        status: allText.includes("transit") || allText.includes("pedestrian") || allText.includes("mobility") ? "pass" : "attention",
        notes: "Multi-modal transit connectivity, bike lanes, and walkability.",
      },
      {
        category: "Urban Design",
        item: "Density & Massing Strategy",
        status: allText.includes("density") || allText.includes("massing") || allText.includes("height") ? "pass" : "attention",
        notes: "Floor area ratio, building envelopes, and solar envelope massing.",
      },
      {
        category: "Urban Design",
        item: "Community Impact & Amenities",
        status: allText.includes("community") || allText.includes("social") || allText.includes("civic") ? "pass" : "attention",
        notes: "Public amenities, affordable housing, and neighborhood benefits.",
      },
      {
        category: "Urban Design",
        item: "Environmental Strategy & Resilience",
        status: allText.includes("resilien") || allText.includes("climate") || allText.includes("green") ? "pass" : "attention",
        notes: "Urban heat island mitigation, stormwater grids, and canopy cover.",
      },
      {
        category: "Urban Design",
        item: "Conclusion & Phasing Strategy",
        status: hasButtons ? "pass" : "attention",
        notes: "Implementation roadmap, stakeholder engagement, and next-step actions.",
      },
    ];
  }

  if (category.includes("landscape")) {
    return [
      {
        category: "Landscape Architecture",
        item: "Site & Topography",
        status: allText.includes("topograph") || allText.includes("slope") || allText.includes("terrain") ? "pass" : "missing",
        notes: "Existing site grading, landform morphology, and elevation contours.",
      },
      {
        category: "Landscape Architecture",
        item: "Planting Palette & Ecology",
        status: allText.includes("plant") || allText.includes("native") || allText.includes("species") ? "pass" : "attention",
        notes: "Native vegetation matrix, biodiversity corridors, and tree canopy.",
      },
      {
        category: "Landscape Architecture",
        item: "Microclimate Mitigation",
        status: allText.includes("shade") || allText.includes("wind") || allText.includes("microclimate") ? "pass" : "attention",
        notes: "Solar shading, prevailing wind buffers, and comfort analysis.",
      },
      {
        category: "Landscape Architecture",
        item: "Stormwater Management",
        status: allText.includes("stormwater") || allText.includes("bioswale") || allText.includes("permeable") ? "pass" : "attention",
        notes: "Rain gardens, bioswales, runoff attenuation, and water harvesting.",
      },
      {
        category: "Landscape Architecture",
        item: "Materials & Hardscape",
        status: allText.includes("paving") || allText.includes("stone") || hasInfoCards ? "pass" : "attention",
        notes: "Permeable pavers, retaining walls, site furnishings, and lighting.",
      },
      {
        category: "Landscape Architecture",
        item: "Public Experience & Access",
        status: hasHotspots || allText.includes("trail") || allText.includes("path") ? "pass" : "attention",
        notes: "Universal accessibility, interactive exploration, and viewing nodes.",
      },
      {
        category: "Landscape Architecture",
        item: "Conclusion & Stewardship",
        status: hasButtons ? "pass" : "attention",
        notes: "Maintenance lifecycle, stewardship plan, and concluding interactive CTA.",
      },
    ];
  }

  // Default Architecture Framework
  return [
    {
      category: "Architecture",
      item: "Project Identity & Typology",
      status: project.title && project.slides.length > 0 ? "pass" : "missing",
      notes: "Clear project naming, scale, and architectural typology.",
    },
    {
      category: "Architecture",
      item: "Site & Context Integration",
      status: allText.includes("site") || allText.includes("context") || allSlideTitles.includes("site") ? "pass" : "attention",
      notes: "Orientation, urban/natural fabric adjacency, and access axes.",
    },
    {
      category: "Architecture",
      item: "Design Concept / Parti",
      status: allSlideTitles.includes("concept") || allText.includes("parti") || allText.includes("concept") ? "pass" : "attention",
      notes: "Governing spatial logic and primary conceptual pillars.",
    },
    {
      category: "Architecture",
      item: "Spatial Organization & Floor Plan",
      status: allSlideTitles.includes("plan") || allText.includes("plan") ? "pass" : "attention",
      notes: "General arrangement plan depicting functional zones and circulation.",
    },
    {
      category: "Architecture",
      item: "Material Strategy & Envelope",
      status: hasInfoCards || allText.includes("timber") || allText.includes("concrete") || allText.includes("glazing") ? "pass" : "attention",
      notes: "Specification cards for structural envelope and primary materials.",
    },
    {
      category: "Architecture",
      item: "Passive Environmental Strategy",
      status: allText.includes("daylight") || allText.includes("solar") || allText.includes("energy") || allText.includes("carbon") ? "pass" : "attention",
      notes: "Daylight harvesting, natural ventilation, and carbon targets.",
    },
    {
      category: "Architecture",
      item: "Interactive Drawing Hotspots",
      status: hasHotspots ? "pass" : "missing",
      notes: "Interactive pins allowing reviewers to explore technical callouts.",
    },
    {
      category: "Architecture",
      item: "Design Evolution / Site Transformation",
      status: hasComparison ? "pass" : "attention",
      notes: "Before/After interactive comparison slider demonstrating site impact.",
    },
    {
      category: "Architecture",
      item: "Synthesis & Interactive CTA",
      status: hasButtons ? "pass" : "attention",
      notes: "Concluding milestones with actionable next-step buttons.",
    },
  ];
}
