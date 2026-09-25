import type { Project, Slide, CanvasElement } from "../types";
import type { IProjectRepository } from "./repository";
import { supabase } from "./supabase";
import { ECOHUB_DEMO_PROJECT } from "./demo-data";
import { generateUuid, isUuid } from "./utils";

/**
 * Normalizes Supabase database row structures into ArchXperience domain models.
 */
interface DbProjectRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  client_audience: string | null;
  aspect_ratio: string;
  is_published: boolean;
  share_slug: string;
  settings: Project["settings"] | null;
  created_at: string;
  updated_at: string;
}

interface DbSlideRow {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  background_color: string | null;
  background_image_url: string | null;
  background_overlay_opacity: number | null;
  transition_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbElementRow {
  id: string;
  slide_id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  rotation: number;
  content: CanvasElement["content"];
  styles: CanvasElement["styles"];
  created_at: string;
  updated_at: string;
}

function mapDbElementToDomain(row: DbElementRow): CanvasElement {
  return {
    id: row.id,
    slideId: row.slide_id,
    type: row.type as CanvasElement["type"],
    x: Number(row.x),
    y: Number(row.y),
    width: Number(row.width),
    height: Number(row.height),
    zIndex: Number(row.z_index),
    rotation: Number(row.rotation || 0),
    content: (row.content || {}) as CanvasElement["content"],
    styles: (row.styles || {}) as CanvasElement["styles"],
  } as CanvasElement;
}

function mapDbSlideToDomain(row: DbSlideRow, elements: CanvasElement[]): Slide {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title || "Untitled Slide",
    orderIndex: row.order_index,
    backgroundColor: row.background_color || "#0C0E12",
    backgroundImageUrl: row.background_image_url || undefined,
    backgroundOverlayOpacity: row.background_overlay_opacity != null ? Number(row.background_overlay_opacity) : 0,
    transitionType: (row.transition_type as Slide["transitionType"]) || "fade",
    notes: row.notes || undefined,
    elements,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbProjectToDomain(
  row: DbProjectRow,
  slides: Slide[] = []
): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    thumbnailUrl: row.thumbnail_url || undefined,
    category: row.category || "Architecture",
    aspectRatio: (row.aspect_ratio as Project["aspectRatio"]) || "16:9",
    isPublished: Boolean(row.is_published),
    shareSlug: row.share_slug,
    settings: row.settings || {
      aspectRatio: "16:9",
      theme: "dark",
      showNavigationArrows: true,
    },
    slides,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseProjectRepository implements IProjectRepository {
  private get client() {
    if (!supabase) {
      throw new Error("Supabase client is not configured or unavailable.");
    }
    return supabase;
  }

  async getProjects(): Promise<Project[]> {
    const { data: projectsData, error: projError } = await this.client
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (projError) {
      console.error("[SupabaseProjectRepository] getProjects error:", projError);
      throw new Error(projError.message);
    }

    if (!projectsData || projectsData.length === 0) {
      return [];
    }

    const projectIds = projectsData.map((p) => p.id);

    // Fetch associated slides in bulk to determine counts & slide thumbnails
    const { data: slidesData, error: slidesError } = await this.client
      .from("slides")
      .select("id, project_id, title, order_index, background_image_url")
      .in("project_id", projectIds)
      .order("order_index", { ascending: true });

    if (slidesError) {
      console.warn("[SupabaseProjectRepository] Slides count fetch warning:", slidesError);
    }

    const slidesByProject = new Map<string, Slide[]>();
    (slidesData || []).forEach((s) => {
      const list = slidesByProject.get(s.project_id) || [];
      list.push({
        id: s.id,
        projectId: s.project_id,
        title: s.title,
        orderIndex: s.order_index,
        backgroundImageUrl: s.background_image_url || undefined,
        elements: [],
        createdAt: "",
        updatedAt: "",
      });
      slidesByProject.set(s.project_id, list);
    });

    return (projectsData as DbProjectRow[]).map((p) =>
      mapDbProjectToDomain(p, slidesByProject.get(p.id) || [])
    );
  }

  async getProject(id: string): Promise<Project | null> {
    const { data: projectRow, error: projError } = await this.client
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (projError) {
      console.error(`[SupabaseProjectRepository] getProject(${id}) error:`, projError);
      return null;
    }
    if (!projectRow) return null;

    // Fetch slides
    const { data: slidesData, error: slidesError } = await this.client
      .from("slides")
      .select("*")
      .eq("project_id", id)
      .order("order_index", { ascending: true });

    if (slidesError) {
      console.error(`[SupabaseProjectRepository] Failed to fetch slides for project ${id}:`, slidesError);
      return null;
    }

    const slideRows = (slidesData || []) as DbSlideRow[];
    const slideIds = slideRows.map((s) => s.id);

    let elementsBySlide = new Map<string, CanvasElement[]>();
    if (slideIds.length > 0) {
      const { data: elementsData, error: elError } = await this.client
        .from("elements")
        .select("*")
        .in("slide_id", slideIds)
        .order("z_index", { ascending: true });

      if (elError) {
        console.error(`[SupabaseProjectRepository] Failed to fetch elements for slides:`, elError);
      } else {
        (elementsData as DbElementRow[] || []).forEach((el) => {
          const list = elementsBySlide.get(el.slide_id) || [];
          list.push(mapDbElementToDomain(el));
          elementsBySlide.set(el.slide_id, list);
        });
      }
    }

    const domainSlides: Slide[] = slideRows.map((s) =>
      mapDbSlideToDomain(s, elementsBySlide.get(s.id) || [])
    );

    return mapDbProjectToDomain(projectRow as DbProjectRow, domainSlides);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    // Queries either by share_slug or direct id
    const isSlugUuid = isUuid(slug);
    let query = this.client.from("projects").select("*");
    if (isSlugUuid) {
      query = query.or(`share_slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq("share_slug", slug);
    }

    const { data: projectRow, error: projError } = await query.maybeSingle();
    if (projError || !projectRow) {
      return null;
    }

    // Must be published to be visible publicly via slug
    if (!projectRow.is_published) {
      return null;
    }

    return this.getProject(projectRow.id);
  }

  async createProject(data: Partial<Project> & { title: string }): Promise<Project> {
    const { data: authData, error: authError } = await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw new Error("Must be authenticated with Supabase to create cloud projects.");
    }
    const userId = authData.user.id;

    const cleanSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const shareSlug = `${cleanSlug || "deck"}-${Math.floor(1000 + Math.random() * 9000)}`;

    const projectId = generateUuid();
    const now = new Date().toISOString();

    // Prepare slides & elements
    const rawSlides = data.slides && data.slides.length > 0 ? data.slides : [
      {
        id: generateUuid(),
        projectId,
        title: "01 / Title Slide",
        orderIndex: 0,
        backgroundColor: "#0C0E12",
        transitionType: "fade" as const,
        elements: [
          {
            id: generateUuid(),
            slideId: "",
            type: "text" as const,
            x: 160,
            y: 360,
            width: 1400,
            height: 140,
            zIndex: 1,
            content: {
              text: data.title,
              fontSize: 64,
              fontWeight: "bold" as const,
              color: "var(--text-primary)",
            },
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Derive stable thumbnail
    let derivedThumbnail = data.thumbnailUrl;
    if (!derivedThumbnail && rawSlides.length > 0) {
      const firstSlide = rawSlides[0];
      derivedThumbnail = firstSlide.backgroundImageUrl || firstSlide.background?.imageUrl;
      if (!derivedThumbnail) {
        const firstImgEl = (firstSlide.elements || []).find((el) => el.type === "image");
        if (firstImgEl && "src" in firstImgEl.content && firstImgEl.content.src) {
          derivedThumbnail = firstImgEl.content.src;
        }
      }
    }
    if (!derivedThumbnail) {
      derivedThumbnail =
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
    }

    const newProjectRow = {
      id: projectId,
      user_id: userId,
      title: data.title,
      description: data.description || "Interactive architectural presentation project.",
      thumbnail_url: derivedThumbnail,
      category: data.category || "Architecture",
      aspect_ratio: data.aspectRatio || "16:9",
      is_published: Boolean(data.isPublished),
      share_slug: shareSlug,
      settings: data.settings || {
        aspectRatio: "16:9",
        theme: "dark",
        showNavigationArrows: true,
      },
    };

    const { error: insertProjErr } = await this.client
      .from("projects")
      .insert(newProjectRow);

    if (insertProjErr) {
      console.error("[SupabaseProjectRepository] createProject failed:", insertProjErr);
      throw new Error(insertProjErr.message);
    }

    const slideIdMap = new Map<string, string>();
    const slideInserts = rawSlides.map((s, idx) => {
      const slideId = isUuid(s.id) ? s.id : generateUuid();
      slideIdMap.set(s.id, slideId);
      return {
        id: slideId,
        project_id: projectId,
        title: s.title || `Slide ${idx + 1}`,
        order_index: idx,
        background_color: s.backgroundColor || "#0C0E12",
        background_image_url: s.backgroundImageUrl || null,
        background_overlay_opacity: s.backgroundOverlayOpacity ?? 0,
        transition_type: s.transitionType || "fade",
        notes: s.notes || null,
        _originalElements: s.elements || [],
      };
    });

    const { error: insertSlidesErr } = await this.client
      .from("slides")
      .insert(
        slideInserts.map(({ _originalElements, ...rest }) => rest)
      );

    if (insertSlidesErr) {
      console.error("[SupabaseProjectRepository] Failed to insert slides:", insertSlidesErr);
      throw new Error(insertSlidesErr.message);
    }

    // Insert elements with targetSlideId remapping
    const elementInserts: Record<string, unknown>[] = [];
    slideInserts.forEach((s) => {
      s._originalElements.forEach((el) => {
        const elementId = isUuid(el.id) ? el.id : generateUuid();
        const updatedContent = { ...(el.content || {}) };
        if (
          "targetSlideId" in updatedContent &&
          updatedContent.targetSlideId &&
          slideIdMap.has(updatedContent.targetSlideId as string)
        ) {
          updatedContent.targetSlideId = slideIdMap.get(updatedContent.targetSlideId as string);
        }

        elementInserts.push({
          id: elementId,
          slide_id: s.id,
          type: el.type,
          x: Number(el.x) || 0,
          y: Number(el.y) || 0,
          width: Number(el.width) || 100,
          height: Number(el.height) || 100,
          z_index: Number(el.zIndex) || 1,
          rotation: Number(el.rotation || 0),
          content: updatedContent,
          styles: el.styles || {},
        });
      });
    });

    if (elementInserts.length > 0) {
      const { error: insertElErr } = await this.client
        .from("elements")
        .insert(elementInserts);

      if (insertElErr) {
        console.warn("[SupabaseProjectRepository] Element insertion warning:", insertElErr);
      }
    }

    const created = await this.getProject(projectId);
    if (!created) {
      throw new Error("Project was created but could not be resolved.");
    }
    return created;
  }


  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    // 1. Update Project Metadata
    const projectUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) projectUpdates.title = updates.title;
    if (updates.description !== undefined) projectUpdates.description = updates.description;
    if (updates.thumbnailUrl !== undefined) projectUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.category !== undefined) projectUpdates.category = updates.category;
    if (updates.aspectRatio !== undefined) projectUpdates.aspect_ratio = updates.aspectRatio;
    if (updates.isPublished !== undefined) projectUpdates.is_published = updates.isPublished;
    if (updates.shareSlug !== undefined) projectUpdates.share_slug = updates.shareSlug;
    if (updates.settings !== undefined) projectUpdates.settings = updates.settings;

    if (Object.keys(projectUpdates).length > 0) {
      const { error: projUpdateErr } = await this.client
        .from("projects")
        .update(projectUpdates)
        .eq("id", id);

      if (projUpdateErr) {
        console.error(`[SupabaseProjectRepository] Failed to update project ${id}:`, projUpdateErr);
        throw new Error(projUpdateErr.message);
      }
    }

    // 2. Synchronize Slides & Elements if present (autosave flow)
    if (updates.slides && Array.isArray(updates.slides)) {
      await this.synchronizeSlidesAndElements(id, updates.slides);
    }

    return this.getProject(id);
  }

  private async synchronizeSlidesAndElements(projectId: string, slides: Slide[]): Promise<void> {
    // Fetch existing slide IDs for this project
    const { data: existingSlidesData } = await this.client
      .from("slides")
      .select("id")
      .eq("project_id", projectId);

    const existingSlideIds = new Set((existingSlidesData || []).map((s) => s.id));
    const incomingSlideIds = new Set<string>();

    const slideUpserts = slides.map((slide, index) => {
      const slideId = isUuid(slide.id) ? slide.id : generateUuid();
      incomingSlideIds.add(slideId);

      return {
        id: slideId,
        project_id: projectId,
        title: slide.title || `Slide ${index + 1}`,
        order_index: index,
        background_color: slide.backgroundColor || "#0C0E12",
        background_image_url: slide.backgroundImageUrl || null,
        background_overlay_opacity: slide.backgroundOverlayOpacity ?? 0,
        transition_type: slide.transitionType || "fade",
        notes: slide.notes || null,
      };
    });

    // Slides to delete
    const slidesToDelete = [...existingSlideIds].filter((sid) => !incomingSlideIds.has(sid));
    if (slidesToDelete.length > 0) {
      await this.client.from("slides").delete().in("id", slidesToDelete);
    }

    // Upsert slides
    if (slideUpserts.length > 0) {
      const { error: slideUpsertErr } = await this.client
        .from("slides")
        .upsert(slideUpserts, { onConflict: "id" });

      if (slideUpsertErr) {
        console.error("[SupabaseProjectRepository] Slide upsert failed:", slideUpsertErr);
        throw new Error(slideUpsertErr.message);
      }
    }

    // Synchronize elements for all incoming slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideId = slideUpserts[i].id;

      // Fetch existing elements on this slide
      const { data: existingElementsData } = await this.client
        .from("elements")
        .select("id")
        .eq("slide_id", slideId);

      const existingElementIds = new Set((existingElementsData || []).map((e) => e.id));
      const incomingElementIds = new Set<string>();

      const elementUpserts = (slide.elements || []).map((el) => {
        const elementId = isUuid(el.id) ? el.id : generateUuid();
        incomingElementIds.add(elementId);


        return {
          id: elementId,
          slide_id: slideId,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          z_index: el.zIndex,
          rotation: el.rotation || 0,
          content: el.content || {},
          styles: el.styles || {},
        };
      });

      const elementsToDelete = [...existingElementIds].filter((eid) => !incomingElementIds.has(eid));
      if (elementsToDelete.length > 0) {
        await this.client.from("elements").delete().in("id", elementsToDelete);
      }

      if (elementUpserts.length > 0) {
        const { error: elUpsertErr } = await this.client
          .from("elements")
          .upsert(elementUpserts, { onConflict: "id" });

        if (elUpsertErr) {
          console.error("[SupabaseProjectRepository] Element upsert failed:", elUpsertErr);
        }
      }
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`[SupabaseProjectRepository] Failed to delete project ${id}:`, error);
      return false;
    }
    return true;
  }

  async duplicateProject(id: string): Promise<Project | null> {
    const original = await this.getProject(id);
    if (!original) return null;

    // Create unique ID map for slide rewriting
    const slideIdMap = new Map<string, string>();
    original.slides.forEach((slide) => {
      slideIdMap.set(slide.id, generateUuid());
    });

    const duplicatedSlides: Slide[] = original.slides.map((slide) => {
      const newSlideId = slideIdMap.get(slide.id)!;
      return {
        ...slide,
        id: newSlideId,
        elements: slide.elements.map((el) => {
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
            id: generateUuid(),
            slideId: newSlideId,
            content: updatedContent,
          } as CanvasElement;
        }),
      };
    });


    return this.createProject({
      title: `${original.title} (Cloud Copy)`,
      description: original.description,
      thumbnailUrl: original.thumbnailUrl,
      category: original.category,
      aspectRatio: original.aspectRatio,
      settings: original.settings,
      slides: duplicatedSlides,
      isPublished: false,
    });
  }

  async resetToDemo(): Promise<Project[]> {
    // In cloud mode, resetToDemo imports the default EcoHub demo project into user's account
    await this.createProject({
      ...ECOHUB_DEMO_PROJECT,
      title: "EcoHub Community Centre (Cloud)",
      isPublished: false,
    });
    return this.getProjects();
  }
}
