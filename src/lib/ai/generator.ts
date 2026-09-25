import type { Project } from "../../types";
import type { AIGenerationRequest, GenerationStage } from "./types";
import { invokeAIGenerationFunction } from "./gemini-client";
import { validateAndSanitizeRawPresentation } from "./validators";
import { postprocessGeneratedPresentation } from "./postprocess";

/**
 * High-Level Orchestrator for ArchXperience AI Presentation Generation.
 * Coordinates stage progress tracking, Edge Function invocation, defensive validation,
 * and canonical post-processing.
 */
export async function generatePresentationExperience(
  request: AIGenerationRequest,
  onStageChange?: (stage: GenerationStage) => void
): Promise<Project> {
  // Stage 1: Analyzing brief
  onStageChange?.("analyzing");
  await new Promise((r) => setTimeout(r, 600));

  // Stage 2: Planning narrative
  onStageChange?.("storytelling");
  await new Promise((r) => setTimeout(r, 700));

  // Stage 3: Structuring slides & calling Edge Function
  onStageChange?.("structuring");
  const rawDataPromise = invokeAIGenerationFunction(request);

  // Update progress stages dynamically while in-flight
  const stageTimer1 = setTimeout(() => onStageChange?.("interactions"), 1800);
  const stageTimer2 = setTimeout(() => onStageChange?.("content"), 3600);

  let rawGenerated;
  try {
    rawGenerated = await rawDataPromise;
  } finally {
    clearTimeout(stageTimer1);
    clearTimeout(stageTimer2);
  }

  // Stage 4: Validating structured output
  onStageChange?.("validating");
  const validated = validateAndSanitizeRawPresentation(rawGenerated);
  await new Promise((r) => setTimeout(r, 400));

  // Stage 5: Finalizing, assigning UUIDs, resolving links & images
  onStageChange?.("finalizing");
  const finalProject = postprocessGeneratedPresentation(validated, request);
  await new Promise((r) => setTimeout(r, 400));

  onStageChange?.("complete");
  return finalProject;
}
