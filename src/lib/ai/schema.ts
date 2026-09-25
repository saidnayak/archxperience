/**
 * Strict JSON Schema definition for Google Gemini Structured Output.
 * Ensures the generative model responds strictly conforming to ArchXperience
 * presentation, slide, element, and interaction specifications.
 */

export const PRESENTATION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: {
      type: "STRING",
      description: "Official title of the architectural project presentation",
    },
    description: {
      type: "STRING",
      description: "Concise spatial design summary and architectural intent statement",
    },
    category: {
      type: "STRING",
      description: "Architectural classification: Architecture, Interior Design, Construction, Urban Design, etc.",
    },
    clientAudience: {
      type: "STRING",
      description: "Target presentation audience (e.g. Client Pitch, Public Consultation)",
    },
    slides: {
      type: "ARRAY",
      description: "Ordered array of 4 to 8 architectural presentation slides",
      items: {
        type: "OBJECT",
        properties: {
          slideRef: {
            type: "STRING",
            description: "Unique semantic reference ID for this slide (e.g. 'slide-hero', 'slide-concept', 'slide-floorplan')",
          },
          title: {
            type: "STRING",
            description: "Slide heading/title (e.g. '01 / Project Overview', '02 / Design Pillars')",
          },
          orderIndex: {
            type: "INTEGER",
            description: "0-indexed presentation sequence number",
          },
          backgroundColor: {
            type: "STRING",
            description: "Background hex color, defaulting to '#0C0E12'",
          },
          backgroundImageRole: {
            type: "STRING",
            description: "Optional semantic role for slide background image (e.g. 'hero_exterior')",
          },
          backgroundOverlayOpacity: {
            type: "NUMBER",
            description: "Opacity of background tint overlay (0.0 to 0.7)",
          },
          transitionType: {
            type: "STRING",
            enum: ["fade", "slide-left", "slide-right", "zoom", "none"],
            description: "Slide transition effect",
          },
          elements: {
            type: "ARRAY",
            description: "Canvas elements placed on the virtual 1920x1080 canvas",
            items: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  enum: ["text", "image", "button", "hotspot", "info_card", "comparison"],
                  description: "Element component type",
                },
                x: {
                  type: "NUMBER",
                  description: "X position on 1920 reference canvas (margin safe: 120-1760)",
                },
                y: {
                  type: "NUMBER",
                  description: "Y position on 1080 reference canvas (margin safe: 80-980)",
                },
                width: {
                  type: "NUMBER",
                  description: "Element width in virtual 1920 canvas pixels",
                },
                height: {
                  type: "NUMBER",
                  description: "Element height in virtual 1080 canvas pixels",
                },
                zIndex: {
                  type: "INTEGER",
                  description: "Layer stacking index (5 to 30)",
                },
                content: {
                  type: "OBJECT",
                  properties: {
                    // Text Element properties
                    text: { type: "STRING" },
                    fontSize: { type: "NUMBER" },
                    fontWeight: {
                      type: "STRING",
                      enum: ["light", "normal", "medium", "semibold", "bold"],
                    },
                    textAlign: {
                      type: "STRING",
                      enum: ["left", "center", "right", "justify"],
                    },
                    color: { type: "STRING" },

                    // Image Element properties
                    imageRole: {
                      type: "STRING",
                      description: "Semantic image role (e.g. 'hero_exterior', 'interior_library', 'floor_plan', 'material_timber', 'courtyard')",
                    },
                    alt: { type: "STRING" },
                    objectFit: {
                      type: "STRING",
                      enum: ["cover", "contain", "fill"],
                    },

                    // Button Element properties
                    label: { type: "STRING" },
                    action: {
                      type: "STRING",
                      enum: ["navigate_slide", "open_url", "none"],
                    },
                    targetSlideRef: {
                      type: "STRING",
                      description: "Semantic slideRef of the target slide for navigation",
                    },
                    variant: {
                      type: "STRING",
                      enum: ["primary", "secondary", "outline", "ghost"],
                    },

                    // Hotspot Element properties
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    triggerType: {
                      type: "STRING",
                      enum: ["click", "hover"],
                    },
                    badgeText: { type: "STRING" },
                    pulseAnimation: { type: "BOOLEAN" },
                    specs: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          label: { type: "STRING" },
                          value: { type: "STRING" },
                        },
                        required: ["label", "value"],
                      },
                    },

                    // Info Card Element properties
                    eyebrow: { type: "STRING" },
                    metadata: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          label: { type: "STRING" },
                          value: { type: "STRING" },
                        },
                        required: ["label", "value"],
                      },
                    },

                    // Comparison Element properties
                    beforeImageRole: { type: "STRING" },
                    afterImageRole: { type: "STRING" },
                    beforeLabel: { type: "STRING" },
                    afterLabel: { type: "STRING" },
                    defaultPosition: { type: "NUMBER" },
                  },
                },
              },
              required: ["type", "x", "y", "width", "height", "content"],
            },
          },
        },
        required: ["slideRef", "title", "orderIndex", "elements"],
      },
    },
  },
  required: ["title", "description", "category", "slides"],
};
