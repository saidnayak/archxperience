import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Badge } from "../components/common/Badge";
import { Dropdown } from "../components/common/Dropdown";
import { Select } from "../components/common/Select";
import { useProjectStore } from "../stores";
import { formatDate } from "../lib/utils";
import { useToast } from "../components/common/Toast";
import { CreateProjectModal } from "../components/dashboard/CreateProjectModal";
import { AIGenerateModal } from "../components/dashboard/AIGenerateModal";
import { RenameModal } from "../components/dashboard/RenameModal";
import { DeleteConfirmModal } from "../components/dashboard/DeleteConfirmModal";
import { PublishModal } from "../components/dashboard/PublishModal";
import { TEMPLATES } from "../lib/templates";
import type { Project } from "../types";
import {
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Calendar,
  Layers,
  MoreVertical,
  Copy,
  Trash2,
  RotateCcw,
  Sparkles,
  Share2,
  Eye,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    duplicateProject,
    deleteProject,
    searchQuery,
    setSearchQuery,
    resetToDemo,
  } = useProjectStore();

  const { showToast } = useToast();

  // Lifecycle: load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [publishTarget, setPublishTarget] = useState<Project | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Filters & Sorting state
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title-asc" | "title-desc">("updated");

  // Filtered & Sorted projects
  const processedProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search match
        const matchesSearch =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase());

        // Category filter match
        const matchesCat = categoryFilter === "All" || p.category === categoryFilter;

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === "title-asc") return a.title.localeCompare(b.title);
        if (sortBy === "title-desc") return b.title.localeCompare(a.title);
        if (sortBy === "created") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Default recently updated
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [projects, searchQuery, categoryFilter, sortBy]);

  // Handle Project Creation from Modal
  const handleCreateProject = async ({
    title,
    description,
    category,
    templateId,
  }: {
    title: string;
    description?: string;
    category: string;
    templateId: string;
  }) => {
    if (isActionPending) return;
    setIsActionPending(true);
    try {
      const tmpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
      const initialSlides = tmpl.createSlides("temp-id");

      const created = await createProject({
        title,
        description,
        category,
        slides: initialSlides,
      });

      setIsCreateOpen(false);
      showToast(`Created presentation "${created.title}"`, "success");
      navigate(`/editor/${created.id}`);
    } catch {
      showToast("Failed to create presentation", "danger");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAISuccess = async (generatedProject: Project) => {
    try {
      const created = await createProject({
        ...generatedProject,
      });
      setIsAIOpen(false);
      showToast(`Generated presentation "${created.title}"`, "success");
      navigate(`/editor/${created.id}`);
    } catch (err) {
      console.error("[DashboardPage] Failed to save AI generated project:", err);
      showToast("Failed to save generated presentation to workspace.", "danger");
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    if (isActionPending) return;
    setIsActionPending(true);
    try {
      const dup = await duplicateProject(id);
      if (dup) {
        showToast(`Duplicated "${title}"`, "success");
      } else {
        showToast(`Failed to duplicate "${title}"`, "danger");
      }
    } catch {
      showToast(`Failed to duplicate "${title}"`, "danger");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isActionPending) return;
    setIsActionPending(true);
    try {
      const success = await deleteProject(deleteTarget.id);
      if (success) {
        showToast(`Deleted "${deleteTarget.title}"`, "info");
        setDeleteTarget(null);
      } else {
        showToast(`Failed to delete "${deleteTarget.title}"`, "danger");
      }
    } catch {
      showToast(`Failed to delete "${deleteTarget.title}"`, "danger");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRename = async (newTitle: string) => {
    if (!renameTarget || isActionPending) return;
    setIsActionPending(true);
    try {
      const updated = await updateProject(renameTarget.id, { title: newTitle });
      if (updated) {
        showToast(`Renamed to "${newTitle}"`, "success");
        setRenameTarget(null);
      } else {
        showToast("Failed to rename presentation", "danger");
      }
    } catch {
      showToast("Failed to rename presentation", "danger");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleTogglePublish = async (publish: boolean) => {
    if (!publishTarget || isActionPending) return;
    setIsActionPending(true);
    try {
      const updated = await updateProject(publishTarget.id, { isPublished: publish });
      if (updated) {
        setPublishTarget(updated);
        showToast(publish ? "Presentation published" : "Presentation unpublished", "info");
      } else {
        showToast("Failed to update publish status", "danger");
      }
    } catch {
      showToast("Failed to update publish status", "danger");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleResetDemo = async () => {
    if (isActionPending) return;
    const confirmed = window.confirm(
      "Reset local workspace to the default EcoHub Community Centre demo project?"
    );
    if (confirmed) {
      setIsActionPending(true);
      try {
        await resetToDemo();
        showToast("Demo project restored", "success");
      } catch {
        showToast("Failed to restore demo project", "danger");
      } finally {
        setIsActionPending(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <PageContainer maxWidth="xl">
        {/* Templates Tab View */}
        {activeTab === "templates" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
                  AEC Presentation Templates
                </h1>
                <p className="text-xs text-text-secondary mt-1">
                  Start with a curated architectural framework and tailor it for your client pitch.
                </p>
              </div>

              <Link to="/dashboard">
                <Button variant="secondary" size="sm">
                  View My Projects
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((tmpl) => (
                <Card
                  key={tmpl.id}
                  variant="default"
                  padding="none"
                  className="flex flex-col justify-between overflow-hidden group border-border hover:border-accent/40 transition-colors"
                >
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-surface-elevated">
                      <img
                        src={tmpl.thumbnailUrl}
                        alt={tmpl.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge size="sm" variant="accent">
                          {tmpl.slideCount} {tmpl.slideCount === 1 ? "Slide" : "Slides"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-0.5 rounded bg-background/85 backdrop-blur-xs text-[10px] font-mono text-text-primary border border-border">
                          {tmpl.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-border/50 flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-text-muted">
                      {tmpl.tags.join(" • ")}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        handleCreateProject({
                          title: `${tmpl.name} Deck`,
                          category: tmpl.category,
                          templateId: tmpl.id,
                        });
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="h-7 text-xs"
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Main Workspace & Projects Tab View */
          <div>
            {/* Top Workspace Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
                  Architectural Workspace
                </h1>
                <p className="text-xs text-text-secondary mt-1">
                  Manage spatial design decks, client presentations, and material schedules.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDemo}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  title="Restore default conceptual demo"
                >
                  Reset Demo
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsAIOpen(true)}
                  leftIcon={<Sparkles className="w-4 h-4 text-accent" />}
                  className="border-accent/40 bg-accent/10 hover:bg-accent/20 text-text-primary shadow-xs"
                >
                  Generate with AI
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsCreateOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Project
                </Button>
              </div>
            </div>

            {/* Quick Onboarding Guidance */}
            {projects.length <= 1 && (
              <div className="p-3 mb-6 rounded-lg bg-surface-elevated/70 border border-border flex items-center justify-between gap-4 text-xs select-none">
                <div className="flex items-center gap-2.5 text-text-secondary">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span>
                    Get started by creating a blank presentation, picking an AEC starter template, or inspecting the EcoHub concept.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="shrink-0 text-accent hover:text-accent font-medium h-7 px-2"
                >
                  New Project &rarr;
                </Button>
              </div>
            )}

            {/* Search, Filter, & Sort Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
              <div className="flex flex-1 items-center gap-2.5">
                <div className="max-w-xs w-full">
                  <Input
                    placeholder="Search presentations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftElement={<Search className="w-4 h-4" />}
                  />
                </div>

                {/* Category Filter */}
                <div className="w-40">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    options={[
                      { value: "All", label: "All Categories" },
                      { value: "Architecture", label: "Architecture" },
                      { value: "Interior Design", label: "Interior Design" },
                      { value: "Construction", label: "Construction" },
                      { value: "Urban Design", label: "Urban Design" },
                      { value: "Product Design", label: "Product Design" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <div className="w-44">
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    options={[
                      { value: "updated", label: "Recently Updated" },
                      { value: "created", label: "Recently Created" },
                      { value: "title-asc", label: "Name (A – Z)" },
                      { value: "title-desc", label: "Name (Z – A)" },
                    ]}
                  />
                </div>

                <span className="text-xs font-mono text-text-muted whitespace-nowrap">
                  {processedProjects.length} {processedProjects.length === 1 ? "project" : "projects"}
                </span>
              </div>
            </div>

            {/* Projects Grid, Loading, Error, or Clean Empty State */}
            {isLoading && projects.length === 0 ? (
              <div className="py-20 text-center border border-border/60 rounded-lg bg-surface/30 p-8 select-none">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-xs text-text-secondary font-mono">Loading presentations...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center border border-rose-500/30 rounded-lg bg-rose-500/5 p-8 select-none space-y-3">
                <p className="text-sm font-semibold text-rose-400">{error}</p>
                <Button variant="secondary" size="sm" onClick={() => loadProjects()}>
                  Retry Loading
                </Button>
              </div>
            ) : processedProjects.length === 0 ? (
              <div className="py-16 text-center border border-border border-dashed rounded-lg bg-surface/40 p-8 select-none">
                <div className="w-12 h-12 rounded-full bg-surface-elevated text-accent border border-border flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-display font-semibold text-text-primary mb-1">
                  Your design experiences start here
                </h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto mb-6 leading-relaxed">
                  {searchQuery || categoryFilter !== "All"
                    ? "No presentations matched your active filters. Try clearing your search query or reset filter."
                    : "Create an interactive presentation for your architectural pitch, client deck, or portfolio."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {searchQuery || categoryFilter !== "All" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("All");
                      }}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsCreateOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Create Project
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => navigate("/editor/proj-ecohub-centre")}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Explore Demo
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedProjects.map((project) => {
                  const isDemo = project.id === "proj-ecohub-centre";
                  const slideCount = project.slides?.length || 0;

                  return (
                    <Card
                      key={project.id}
                      variant="default"
                      padding="none"
                      className="group border-border hover:border-border-strong flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Visual Thumbnail */}
                        <div className="relative aspect-video w-full overflow-hidden bg-surface-elevated">
                          {project.thumbnailUrl ? (
                            <img
                              src={project.thumbnailUrl}
                              alt={project.title}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                              <Layers className="w-8 h-8 opacity-40" />
                            </div>
                          )}

                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {isDemo && (
                              <Badge size="sm" variant="accent">
                                Concept Demo
                              </Badge>
                            )}

                            <Badge size="sm" variant={project.isPublished ? "success" : "default"}>
                              {project.isPublished ? "Published" : "Draft"}
                            </Badge>

                            {/* Dropdown Menu for Project Card */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <Dropdown
                                trigger={
                                  <button
                                    className="w-6 h-6 rounded bg-background/80 backdrop-blur-xs flex items-center justify-center text-text-muted hover:text-text-primary border border-border cursor-pointer"
                                    aria-label="Project Actions"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                }
                                items={[
                                  {
                                    id: "rename",
                                    label: "Rename",
                                    icon: <Edit3 className="w-3.5 h-3.5" />,
                                    onClick: () => setRenameTarget(project),
                                  },
                                  {
                                    id: "publish",
                                    label: project.isPublished ? "Manage Publish Link" : "Publish Experience",
                                    icon: <Share2 className="w-3.5 h-3.5" />,
                                    onClick: () => setPublishTarget(project),
                                  },
                                  {
                                    id: "dup",
                                    label: "Duplicate",
                                    icon: <Copy className="w-3.5 h-3.5" />,
                                    onClick: () => handleDuplicate(project.id, project.title),
                                  },
                                  {
                                    id: "del",
                                    label: "Delete Project",
                                    icon: <Trash2 className="w-3.5 h-3.5 text-danger" />,
                                    danger: true,
                                    onClick: () => setDeleteTarget(project),
                                  },
                                ]}
                              />
                            </div>
                          </div>

                          {project.category && (
                            <div className="absolute bottom-3 left-3">
                              <span className="px-2 py-0.5 rounded bg-background/85 backdrop-blur-xs text-[10px] font-mono text-text-primary border border-border">
                                {project.category}
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-3 right-3">
                            <span className="px-2 py-0.5 rounded bg-background/85 backdrop-blur-xs text-[10px] font-mono text-text-secondary border border-border">
                              {slideCount} {slideCount === 1 ? "slide" : "slides"}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="p-4 space-y-1.5">
                          <h3 className="text-sm font-semibold text-text-primary tracking-tight truncate">
                            {project.title}
                          </h3>
                          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                            {project.description || "Interactive presentation project."}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 pt-0 flex items-center justify-between border-t border-border/50 mt-3 text-[11px] text-text-muted">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setPublishTarget(project)}
                            title="Publish & Share Link"
                          >
                            <Share2 className="w-3.5 h-3.5 mr-1" />
                            Share
                          </Button>

                          <Link to={`/preview/${project.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              Preview
                            </Button>
                          </Link>

                          <Link to={`/editor/${project.id}`}>
                            <Button variant="secondary" size="sm" className="h-7 px-2 text-xs">
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateProject}
          onOpenAI={() => setIsAIOpen(true)}
        />

        {/* AI Presentation Generator Modal */}
        <AIGenerateModal
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          onSuccess={handleAISuccess}
          onUseTemplateFallback={(tmplId, title) =>
            handleCreateProject({
              title,
              category: "Architecture",
              templateId: tmplId,
            })
          }
        />

        {/* Rename Modal */}
        {renameTarget && (
          <RenameModal
            isOpen={Boolean(renameTarget)}
            onClose={() => setRenameTarget(null)}
            currentTitle={renameTarget.title}
            onRename={handleRename}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <DeleteConfirmModal
            isOpen={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            projectTitle={deleteTarget.title}
            onConfirm={handleConfirmDelete}
          />
        )}

        {/* Publish / Share Modal */}
        {publishTarget && (
          <PublishModal
            isOpen={Boolean(publishTarget)}
            onClose={() => setPublishTarget(null)}
            projectTitle={publishTarget.title}
            shareSlug={publishTarget.shareSlug}
            isPublished={publishTarget.isPublished}
            slideCount={publishTarget.slides?.length || 1}
            onTogglePublish={handleTogglePublish}
          />
        )}

      </PageContainer>
    </DashboardLayout>
  );
};
