import { describe, expect, it } from "vitest";
import {
  buildModelManifestEntry,
  detectModelKind,
  inspectModelFile,
} from "../modelPrep.ts";

describe("modelPrep", () => {
  it("detects VRM files as directly loadable companion models", () => {
    const report = inspectModelFile({
      name: "partner.vrm",
      size: 12_000_000,
      type: "model/gltf-binary",
    });

    expect(report.kind).toBe("vrm");
    expect(report.canLoadInNightClaw).toBe(true);
    expect(report.requiresExternalConversion).toBe(false);
    expect(report.targetPipeline).toBe("direct-vrm");
    expect(report.actions[0]).toContain("Load directly");
  });

  it("marks Unity packages as engine assets that need export or bridge support", () => {
    const report = inspectModelFile({
      name: "seller-avatar.unitypackage",
      size: 450_000_000,
      type: "application/octet-stream",
    });

    expect(report.kind).toBe("unitypackage");
    expect(report.canLoadInNightClaw).toBe(false);
    expect(report.requiresExternalConversion).toBe(true);
    expect(report.targetPipeline).toBe("engine-bridge");
    expect(report.actions.join(" ")).toContain("UniVRM");
  });

  it("marks Unreal assets as bridge/export work rather than pretending they are VRM", () => {
    const report = inspectModelFile({
      name: "adult_companion.uasset",
      size: 90_000_000,
      type: "application/octet-stream",
    });

    expect(report.kind).toBe("uasset");
    expect(report.canLoadInNightClaw).toBe(false);
    expect(report.requiresExternalConversion).toBe(true);
    expect(report.targetPipeline).toBe("engine-bridge");
    expect(report.actions.join(" ")).toContain("VRM4U");
  });

  it("keeps redistribution rights explicit in the local manifest", () => {
    const entry = buildModelManifestEntry(
      { name: "private-model.vrm", size: 5_000, type: "" },
      { licenseLabel: "Personal stream-only", redistributable: false },
    );

    expect(entry.filename).toBe("private-model.vrm");
    expect(entry.rights.redistributable).toBe(false);
    expect(entry.rights.licenseLabel).toBe("Personal stream-only");
  });

  it("normalizes extensions without trusting MIME types", () => {
    expect(detectModelKind("CHARACTER.VRM")).toBe("vrm");
    expect(detectModelKind("mesh.glb")).toBe("glb");
    expect(detectModelKind("scene.gltf")).toBe("gltf");
    expect(detectModelKind("rig.fbx")).toBe("fbx");
    expect(detectModelKind("asset.unknown")).toBe("unknown");
  });
});
