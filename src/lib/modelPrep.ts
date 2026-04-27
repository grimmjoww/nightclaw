export type SourceModelKind =
  | "vrm"
  | "glb"
  | "gltf"
  | "fbx"
  | "unitypackage"
  | "uasset"
  | "unknown";

export type ModelPrepPipeline =
  | "direct-vrm"
  | "vrm-export"
  | "engine-bridge"
  | "unsupported";

export interface FileLike {
  name: string;
  size: number;
  type?: string;
}

export interface ModelRights {
  licenseLabel: string;
  redistributable: boolean;
  source?: string;
  notes?: string;
}

export interface ModelManifestEntry {
  filename: string;
  addedAt: string;
  sizeBytes: number;
  kind: SourceModelKind;
  rights: ModelRights;
}

export interface ModelPrepReport {
  filename: string;
  sizeBytes: number;
  kind: SourceModelKind;
  canLoadInNightClaw: boolean;
  requiresExternalConversion: boolean;
  targetPipeline: ModelPrepPipeline;
  actions: string[];
  warnings: string[];
}

export function detectModelKind(filename: string): SourceModelKind {
  const lower = filename.trim().toLowerCase();
  if (lower.endsWith(".vrm")) return "vrm";
  if (lower.endsWith(".glb")) return "glb";
  if (lower.endsWith(".gltf")) return "gltf";
  if (lower.endsWith(".fbx")) return "fbx";
  if (lower.endsWith(".unitypackage")) return "unitypackage";
  if (lower.endsWith(".uasset")) return "uasset";
  return "unknown";
}

export function inspectModelFile(file: FileLike): ModelPrepReport {
  const kind = detectModelKind(file.name);
  const base = {
    filename: file.name,
    sizeBytes: file.size,
    kind,
  };

  switch (kind) {
    case "vrm":
      return {
        ...base,
        canLoadInNightClaw: true,
        requiresExternalConversion: false,
        targetPipeline: "direct-vrm",
        actions: [
          "Load directly in NightClaw.",
          "Keep the original license note in the local model manifest.",
          "Use VRMA files for custom motions when the model's rig accepts them.",
        ],
        warnings: [
          "Very heavy textures can slow the desktop overlay; downscale only in your own copy.",
        ],
      };
    case "glb":
    case "gltf":
      return {
        ...base,
        canLoadInNightClaw: false,
        requiresExternalConversion: true,
        targetPipeline: "vrm-export",
        actions: [
          "Open in Blender or Unity and export as VRM 0.x/1.0.",
          "Confirm humanoid bones, facial expressions, spring bones, and collision before import.",
          "Save the exported .vrm into NightClaw instead of editing the source asset.",
        ],
        warnings: [
          "Generic glTF/GLB assets do not guarantee VRM expressions, humanoid mapping, or look-at data.",
        ],
      };
    case "fbx":
      return {
        ...base,
        canLoadInNightClaw: false,
        requiresExternalConversion: true,
        targetPipeline: "vrm-export",
        actions: [
          "Import into Blender or Unity, repair materials/rig, then export through UniVRM.",
          "Bake or remap textures before export if the seller package uses engine-specific materials.",
          "Load only the exported .vrm into NightClaw.",
        ],
        warnings: [
          "FBX material graphs and blendshapes often need manual cleanup before VRM export.",
        ],
      };
    case "unitypackage":
      return {
        ...base,
        canLoadInNightClaw: false,
        requiresExternalConversion: true,
        targetPipeline: "engine-bridge",
        actions: [
          "Import into a Unity project with UniVRM installed, then export a redistribution-safe .vrm.",
          "For live engine use, expose the Unity character through VMC/OSC or a dedicated bridge.",
          "Keep seller texture/material instructions beside the manifest because they are not standardized.",
        ],
        warnings: [
          "A .unitypackage is an engine package, not a loadable desktop VRM model.",
          "Do not redistribute bought assets unless the seller license explicitly allows it.",
        ],
      };
    case "uasset":
      return {
        ...base,
        canLoadInNightClaw: false,
        requiresExternalConversion: true,
        targetPipeline: "engine-bridge",
        actions: [
          "Open in Unreal and export through a supported path such as FBX plus VRM conversion or VRM4U.",
          "For Unreal-native companions, use a future bridge layer instead of forcing .uasset into Three.js.",
          "Keep Unreal materials/textures in their source project until a clean VRM export exists.",
        ],
        warnings: [
          "A .uasset is Unreal-native data and cannot be parsed directly by the current Tauri/Three.js renderer.",
          "Marketplace licenses can differ sharply between streaming, commercial, and redistribution use.",
        ],
      };
    case "unknown":
      return {
        ...base,
        canLoadInNightClaw: false,
        requiresExternalConversion: true,
        targetPipeline: "unsupported",
        actions: [
          "Convert the asset to VRM before importing.",
          "Keep the original asset untouched and document its source license.",
        ],
        warnings: [
          "NightClaw currently accepts .vrm directly and prepares common engine formats for export workflows.",
        ],
      };
  }
}

export function buildModelManifestEntry(
  file: FileLike,
  rights?: Partial<ModelRights>,
): ModelManifestEntry {
  return {
    filename: file.name,
    addedAt: new Date().toISOString(),
    sizeBytes: file.size,
    kind: detectModelKind(file.name),
    rights: {
      licenseLabel: rights?.licenseLabel ?? "Unspecified BYO asset",
      redistributable: rights?.redistributable ?? false,
      source: rights?.source,
      notes: rights?.notes,
    },
  };
}
