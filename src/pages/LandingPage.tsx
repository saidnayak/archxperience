import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TopNavigation } from "../components/layout/TopNavigation";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { BeforeAfterSlider } from "../components/viewer/BeforeAfterSlider";
import { InteractiveHotspot } from "../components/viewer/InteractiveHotspot";
import { InfoPanel } from "../components/viewer/InfoPanel";
import type { InfoPanelData } from "../components/viewer/InfoPanel";
import { fadeUp, staggerContainer } from "../lib/motion";
import {
  Layers,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Share2,
  Sliders,
} from "lucide-react";
import { DEMO_PROJECT_ID } from "../lib/demo-data";

export const LandingPage: React.FC = () => {
  // Interactive showcase demo state
  const [selectedHotspot, setSelectedHotspot] = useState<InfoPanelData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const demoHotspots = [
    {
      id: "hotspot-1",
      x: 34,
      y: 45,
      content: {
        title: "Glulam Cantilever Beam",
        badgeText: "01",
        action: "open_panel" as const,
      },
      panelData: {
        title: "Glulam Structural Framing",
        category: "Structural Engineering",
        description:
          "Sustainably sourced European Spruce glue-laminated timber beams with double-curved CNC milling. Provides an unobstructed 18-meter clear span over the public atrium.",
        imageUrl:
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        specs: [
          { label: "Material", value: "GL28h European Spruce" },
          { label: "Clear Span", value: "18.4 meters" },
          { label: "Embodied Carbon", value: "-412 kg CO₂e/m³" },
          { label: "Fire Resistance", value: "REI 90 min" },
        ],
      },
    },
    {
      id: "hotspot-2",
      x: 68,
      y: 62,
      content: {
        title: "Solar Facade Glazing",
        badgeText: "02",
        action: "open_panel" as const,
      },
      panelData: {
        title: "High-Performance Solar Glazing",
        category: "Building Envelope",
        description:
          "Triple-pane low-emissivity structural glazing with automated solar tracking louvers to optimize daylight penetration while minimizing peak thermal gain.",
        imageUrl:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        specs: [
          { label: "U-Value", value: "0.78 W/m²K" },
          { label: "g-Value (SHGC)", value: "0.32" },
          { label: "Acoustic Rating", value: "Rw 44 dB" },
          { label: "Light Transmission", value: "68%" },
        ],
      },
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <TopNavigation variant="marketing" />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-border grid-pattern">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <Badge variant="accent" size="md">
                Interactive AEC Presentation Studio
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-text-primary text-balance"
            >
              Don’t just present the design. <br />
              <span className="text-accent">Let them experience it.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto font-light leading-relaxed"
            >
              ArchXperience transforms static architectural presentations into interactive digital journeys.
              Allow clients, consultants, and juries to explore spaces, inspect material callouts,
              and compare design iterations dynamically.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Create Experience
                </Button>
              </Link>
              <a href="#showcase" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  leftIcon={<Eye className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Explore Demo
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Product Story / How It Works: The 5-Step Pipeline */}
      <section id="workflow" className="py-20 border-b border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="default" size="sm">
              The Product Journey
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              How ArchXperience Works
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              From raw design brief to published interactive experience in five fluid steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: "01",
                title: "Static Presentation",
                desc: "Start with existing 2D CAD drawings, perspective renders, and site plans.",
                icon: <Layers className="w-4 h-4 text-accent" />,
              },
              {
                step: "02",
                title: "AI Generation",
                desc: "Describe your AEC brief. AI synthesizes a structured, multi-slide presentation.",
                icon: <Sparkles className="w-4 h-4 text-accent" />,
              },
              {
                step: "03",
                title: "AEC Intelligence",
                desc: "Automated review audits layout density, technical specs, and persona tone.",
                icon: <ShieldCheck className="w-4 h-4 text-accent" />,
              },
              {
                step: "04",
                title: "Interactive Studio",
                desc: "Position clickable hotspots, add split comparison sliders, and refine drawings.",
                icon: <Sliders className="w-4 h-4 text-accent" />,
              },
              {
                step: "05",
                title: "Published Experience",
                desc: "Publish a clean client-ready link that stakeholders explore at their own pace.",
                icon: <Share2 className="w-4 h-4 text-accent" />,
              },
            ].map((st, i) => (
              <div
                key={st.step}
                className="p-4 rounded border border-border bg-surface-elevated/70 flex flex-col justify-between relative group hover:border-accent/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-accent font-semibold tracking-wider">
                      {st.step}
                    </span>
                    <div className="w-7 h-7 rounded bg-surface border border-border flex items-center justify-center">
                      {st.icon}
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-text-primary mb-1.5">{st.title}</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{st.desc}</p>
                </div>

                {i < 4 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-border-strong">
                    &rarr;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Product Concept: Static vs Interactive */}
      <section id="concept" className="py-20 border-b border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              The Evolution of Architectural Presentations
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Static slide decks force clients to passively watch. ArchXperience turns every drawing and render into a tactile, navigable presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Traditional */}
            <Card variant="default" padding="lg" className="border-border/60 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="outline" size="sm">
                  Traditional Workflow
                </Badge>
                <h3 className="text-lg font-semibold text-text-primary">
                  Static Slides & PDF Deliverables
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Heavy 100-page decks filled with non-interactive renders, disjointed plan drawings, and dense text boxes that overwhelm viewers and lose design intent.
                </p>

                <div className="pt-4 space-y-2.5 text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    <span>Passive viewing without spatial context</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    <span>Disconnected floor plans and 3D renders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    <span>Cumbersome PDF email attachments and version chaos</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ArchXperience */}
            <Card variant="elevated" padding="lg" className="border-accent/40 bg-surface-elevated shadow-accent-glow flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="accent" size="sm">
                  ArchXperience Approach
                </Badge>
                <h3 className="text-lg font-semibold text-text-primary">
                  Immersive Digital Design Experiences
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Live web experiences where stakeholders tap hotspots on floor plans to inspect room renders, slide before/after iterations, and discover structural specifications.
                </p>

                <div className="pt-4 space-y-2.5 text-xs text-text-primary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Clickable hotspots reveal material and structural data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Real-time split sliders for design iteration comparisons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Clean client-ready link that opens smoothly on laptop and tablet</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. AI Generation & AEC Intelligence Section */}
      <section id="ai-features" className="py-20 border-b border-border bg-surface/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="accent" size="sm">
              Intelligence Built for AEC
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              AI Presentation Generator & AEC Review
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Not a generic chatbot. Purpose-built tools trained on spatial communication, building standards, and client psychology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Generator Spotlight */}
            <div className="p-6 rounded-lg border border-border bg-surface-elevated/60 space-y-4">
              <div className="w-9 h-9 rounded bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                AI Presentation Generator
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Describe your project brief, architectural style, and target audience. Gemini 2.5 Flash synthesizes a tailored multi-slide experience complete with title slides, spatial concepts, floor plans, and sustainability specs.
              </p>
              <div className="pt-2 space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Structured 1920×1080 canvas element layout generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Curated architectural imagery & spatial themes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Interactive starter hotspots & comparison blocks</span>
                </div>
              </div>
            </div>

            {/* AEC Intelligence Spotlight */}
            <div className="p-6 rounded-lg border border-border bg-surface-elevated/60 space-y-4">
              <div className="w-9 h-9 rounded bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                AEC Intelligence Engine
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Experience Review audits your presentation against 15 deterministic architectural rules. The Slide Assistant suggests non-destructive improvements with before/after diffs, and the Hotspot Advisor suggests technical pin placements.
              </p>
              <div className="pt-2 space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Deterministic quality checks + AI narrative critique</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Audience Tuner: Client, Academic Jury, & Investor personas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Non-destructive slide improvements with atomic undo/redo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive AEC Showcase Teaser (Live Interactive Prototype) */}
      <section id="showcase" className="py-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <Badge variant="accent" size="sm" className="mb-2">
                Live Interactive Showcase
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
                Explore an Interactive Project Slide
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Click on the numbered pulsing hotspots below to inspect architectural specifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-text-muted">
                Sample: Cultural Waterfront Pavilion
              </span>
            </div>
          </div>

          {/* Interactive Showcase Viewport */}
          <div className="relative w-full aspect-video rounded border border-border-strong bg-surface overflow-hidden shadow-elevated">
            {/* Background Architecture Render */}
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80"
              alt="Nordic Cultural Pavilion"
              className="w-full h-full object-cover"
            />

            {/* Interactive Hotspots Overlaid */}
            {demoHotspots.map((hs) => (
              <div
                key={hs.id}
                style={{
                  position: "absolute",
                  left: `${hs.x}%`,
                  top: `${hs.y}%`,
                }}
                className="-translate-x-1/2 -translate-y-1/2 z-20"
              >
                <InteractiveHotspot
                  content={hs.content}
                  onClick={() => {
                    setSelectedHotspot(hs.panelData);
                    setIsPanelOpen(true);
                  }}
                />
              </div>
            ))}

            {/* Corner Presentation Badge */}
            <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded bg-surface-elevated/90 backdrop-blur-md border border-border text-xs font-semibold text-text-primary flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>Nordic Cultural Center — Atrium Detail</span>
            </div>

            <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 rounded bg-background/80 backdrop-blur-xs text-[11px] font-mono text-text-secondary border border-border">
              Click hotspots [01] & [02] to reveal technical engineering sheets
            </div>
          </div>

          {/* Slide-over Info Panel */}
          <InfoPanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            data={selectedHotspot}
          />
        </div>
      </section>

      {/* 6. Before/After Design Comparison Showcase */}
      <section className="py-20 border-b border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <Badge variant="default" size="sm">
              Design Iteration
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              Interactive Before / After Comparisons
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Drag the center slider to inspect proposed architectural intervention against existing site conditions.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1600&q=80"
              afterImage="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"
              beforeLabel="Existing Warehouse Site (2023)"
              afterLabel="Proposed Civic Studio (2026)"
              initialSplit={50}
            />
          </div>
        </div>
      </section>

      {/* 7. Capabilities Overview */}
      <section id="features" className="py-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="accent" size="sm">
              Platform Capabilities
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              Engineered for Spatial & AEC Teams
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Tools specifically tailored to showcase physical spaces, building performance, and material choices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" padding="lg" className="space-y-3">
              <div className="w-9 h-9 rounded bg-surface-elevated text-accent flex items-center justify-center border border-border">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Spatial Navigation</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Connect 2D floor plans directly to perspective renders. Allow stakeholders to click a room marker to enter the space.
              </p>
            </Card>

            <Card variant="default" padding="lg" className="space-y-3">
              <div className="w-9 h-9 rounded bg-surface-elevated text-accent flex items-center justify-center border border-border">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Interactive Spec Sheets</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Attach U-values, embodied carbon data, finishes, and supplier references directly to architectural hotspots.
              </p>
            </Card>

            <Card variant="default" padding="lg" className="space-y-3">
              <div className="w-9 h-9 rounded bg-surface-elevated text-accent flex items-center justify-center border border-border">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Iteration Comparison</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Compare option schemes, zoning massing variations, or historic restoration phases side-by-side with fluid split sliders.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. AEC Personas */}
      <section id="use-cases" className="py-20 border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
              Built for Every Stage of Design
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              From concept competition entries to developer client handoffs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Architects",
                desc: "Competition pitches, concept narratives, and client approval meetings.",
              },
              {
                title: "Interior Designers",
                desc: "Material boards, furniture schedules, and lighting ambience studies.",
              },
              {
                title: "Developers & Real Estate",
                desc: "Marketing suites, leasing presentations, and stakeholder tours.",
              },
              {
                title: "Design Students & Faculty",
                desc: "Thesis reviews, portfolio showcases, and academic jury defenses.",
              },
            ].map((uc, i) => (
              <div
                key={i}
                className="p-5 rounded border border-border bg-surface-elevated/70 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-accent uppercase mb-2">0{i + 1}</div>
                  <h4 className="text-sm font-semibold text-text-primary mb-1">{uc.title}</h4>
                  <p className="text-xs text-text-secondary">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="py-20 relative overflow-hidden grid-pattern">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Don’t just present the design. <br />
            <span className="text-accent">Let them experience it.</span>
          </h2>
          <p className="text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
            Create presentations that stakeholders can navigate, inspect, and understand. Launch Studio in your browser or explore our conceptual flagship project.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Experience
              </Button>
            </Link>
            <Link to={`/editor/${DEMO_PROJECT_ID}`} className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" leftIcon={<Eye className="w-4 h-4" />}>
                Explore Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Honest Footer */}
      <footer className="border-t border-border bg-surface py-12 text-xs text-text-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent text-text-primary flex items-center justify-center">
              <Layers className="w-3 h-3" />
            </div>
            <span className="font-display font-semibold tracking-architectural uppercase text-text-primary">
              ARCHXPERIENCE
            </span>
          </div>

          <div className="text-center sm:text-right text-text-muted font-mono text-[11px]">
            Interactive Spatial Presentation Engine • Designed for Architecture & Design Teams
          </div>
        </div>
      </footer>
    </div>
  );
};
