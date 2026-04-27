import { useState, useCallback, useRef, useEffect } from "react";
import type { PrivacySettings } from "../lib/privacyManager.ts";
import type { SavedModel } from "../lib/modelManager.ts";
import type { CustomAnimation } from "../lib/customAnimationManager.ts";
import { getTriggerLabel } from "../lib/triggerParser.ts";
import { inspectModelFile, type ModelPrepReport } from "../lib/modelPrep.ts";
import {
  DEFAULT_VOICE_SETTINGS,
  VoiceManager,
  loadVoiceSettings,
  normalizeVoiceSettings,
  saveVoiceSettings,
  type VoiceProvider,
  type VoiceSettings,
} from "../lib/voiceProviders.ts";
import { isEnabled, enable, disable } from "@tauri-apps/plugin-autostart";
import { invoke } from "@tauri-apps/api/core";
import { log } from "../lib/logger.ts";
import { locale, getLocaleCode, setLocale, LOCALE_OPTIONS } from "../lib/i18n";
import type { SupportedLocale } from "../lib/i18n";
import OpenClawSettings from "./settings/OpenClawSettings.tsx";
import BehaviorSettings from "./settings/BehaviorSettings.tsx";
import PrivacySettingsCard from "./settings/PrivacySettings.tsx";
import { Toggle } from "./settings/Toggle.tsx";
import "./Settings.css";

// ---------- Autostart Toggle ----------

function AutostartToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isEnabled()
      .then(setEnabled)
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  // Auto-clear error
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const toggle = useCallback(async () => {
    setError(null);
    try {
      if (enabled) {
        await disable();
        setEnabled(false);
      } else {
        await enable();
        setEnabled(true);
      }
    } catch (err) {
      log.error("[Settings] autostart toggle failed:", err);
      setError(locale().ui_autostart_error);
    }
  }, [enabled]);

  return (
    <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="settings-row-label">{locale().ui_autostart}</span>
        <Toggle checked={enabled} onChange={toggle} disabled={loading} />
      </div>
      {error && (
        <span style={{ fontSize: 11, color: "rgba(248, 113, 113, 0.9)", marginTop: 4 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ---------- Resource Usage ----------

function ResourceUsage({ isOpen }: { isOpen: boolean }) {
  const [memoryMb, setMemoryMb] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchStats = () => {
      invoke<{ memory_mb: number }>("get_process_stats")
        .then((stats) => setMemoryMb(stats.memory_mb))
        .catch((err) => log.warn("[Settings] get_process_stats failed:", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10_000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <span className="settings-row-value">
      {memoryMb !== null ? locale().ui_memory_format(memoryMb) : "-"}
    </span>
  );
}

// ---------- Model List ----------

function ModelList({
  currentModelName,
  onModelSwitch,
  onModelDelete,
  isOpen,
}: {
  currentModelName: string;
  onModelSwitch: (filename: string) => void;
  onModelDelete: (filename: string) => void;
  isOpen: boolean;
}) {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    import("../lib/modelManager.ts")
      .then(({ listModels }) => listModels())
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDefaultActive = currentModelName === "default.vrm" || !currentModelName;

  return (
    <div className="settings-model-list">
      {/* Default model — always shown */}
      <div
        className={`settings-model-item ${isDefaultActive ? "active" : ""}`}
        onClick={() => onModelSwitch("default.vrm")}
      >
        <div className="settings-model-item-info">
          <span className="settings-model-item-name">default.vrm</span>
          <span className="settings-model-item-meta">{locale().ui_model_builtin}</span>
        </div>
        {isDefaultActive && (
          <span className="settings-model-item-badge">{locale().ui_model_active}</span>
        )}
      </div>

      {/* Saved models */}
      {models.map((model) => {
        const isActive = currentModelName === model.filename;
        return (
          <div
            key={model.filename}
            className={`settings-model-item ${isActive ? "active" : ""}`}
            onClick={() => onModelSwitch(model.filename)}
          >
            <div className="settings-model-item-info">
              <span className="settings-model-item-name">{model.filename}</span>
              <span className="settings-model-item-meta">{formatSize(model.sizeBytes)}</span>
            </div>
            <div className="settings-model-item-actions">
              {isActive && (
                <span className="settings-model-item-badge">{locale().ui_model_active}</span>
              )}
              <button
                className="settings-model-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onModelDelete(model.filename);
                  setModels((prev) => prev.filter((m) => m.filename !== model.filename));
                }}
              >
                {locale().ui_model_delete}
              </button>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="settings-model-item-loading">Loading...</div>
      )}
    </div>
  );
}

// ---------- Model Prep ----------

function ModelPrepPanel() {
  const [report, setReport] = useState<ModelPrepReport | null>(null);
  const prepInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReport(inspectModelFile(file));
    }
    e.target.value = "";
  }, []);

  return (
    <div className="settings-card">
      <div className="settings-card-title">Model Prep</div>
      <div className="settings-row">
        <div className="settings-row-label">
          Asset check
          <div className="settings-row-sublabel">
            VRM, GLB, FBX, Unity package, or Unreal asset
          </div>
        </div>
        <button
          className="settings-btn"
          onClick={() => prepInputRef.current?.click()}
        >
          Check
        </button>
        <input
          ref={prepInputRef}
          type="file"
          accept=".vrm,.glb,.gltf,.fbx,.unitypackage,.uasset"
          className="settings-file-input"
          onChange={handleFileSelect}
        />
      </div>

      {report && (
        <div className="settings-prep-report">
          <div className="settings-chip-row">
            <span className="settings-chip">{report.kind}</span>
            <span className={`settings-chip ${report.canLoadInNightClaw ? "ok" : "warn"}`}>
              {report.canLoadInNightClaw ? "Direct" : "Export needed"}
            </span>
            <span className="settings-chip">{report.targetPipeline}</span>
          </div>
          <div className="settings-model-item-name">{report.filename}</div>
          <ul className="settings-compact-list">
            {report.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          {report.warnings.length > 0 && (
            <ul className="settings-compact-list warning">
              {report.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Custom Animation List ----------

function CustomAnimationList({
  onAdd,
  onDelete,
  isOpen,
}: {
  onAdd: (file: File, triggerText: string) => void;
  onDelete: (filename: string) => void;
  isOpen: boolean;
}) {
  const [animations, setAnimations] = useState<CustomAnimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [triggerText, setTriggerText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const animFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    import("../lib/customAnimationManager.ts")
      .then(({ listCustomAnimations }) => listCustomAnimations())
      .then(setAnimations)
      .catch(() => setAnimations([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.toLowerCase().endsWith(".vrma")) {
        setPendingFile(file);
        setAdding(true);
      }
      e.target.value = "";
    },
    [],
  );

  const handleConfirmAdd = useCallback(() => {
    if (!pendingFile) return;
    onAdd(pendingFile, triggerText);
    setAnimations((prev) => [
      ...prev.filter((a) => a.filename !== pendingFile.name),
      {
        filename: pendingFile.name,
        displayName: pendingFile.name.replace(/\.vrma$/i, ""),
        triggerText,
        triggerParsed: null,
        addedAt: new Date().toISOString(),
        sizeBytes: pendingFile.size,
      },
    ]);
    setPendingFile(null);
    setTriggerText("");
    setAdding(false);
  }, [pendingFile, triggerText, onAdd]);

  const handleCancelAdd = useCallback(() => {
    setPendingFile(null);
    setTriggerText("");
    setAdding(false);
  }, []);

  const triggerBadge = (anim: CustomAnimation) => {
    if (!anim.triggerParsed) return locale().ui_trigger_parsing;
    return getTriggerLabel(anim.triggerParsed);
  };

  const triggerTypeLabel = (anim: CustomAnimation) => {
    if (!anim.triggerParsed) return "";
    switch (anim.triggerParsed.type) {
      case "emotion": return locale().ui_trigger_emotion;
      case "event": return locale().ui_trigger_event;
      case "ambient": return locale().ui_trigger_ambient;
      case "scheduled": return locale().ui_trigger_scheduled;
      case "idle": return locale().ui_trigger_idle;
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-card-title">{locale().ui_custom_animations_title}</div>

      {/* Animation list */}
      <div className="settings-model-list">
        {animations.map((anim) => (
          <div key={anim.filename} className="settings-model-item">
            <div className="settings-model-item-info">
              <span className="settings-model-item-name">{anim.displayName}</span>
              <span className="settings-model-item-meta">
                {triggerTypeLabel(anim)}{triggerTypeLabel(anim) ? ": " : ""}{triggerBadge(anim)}
              </span>
            </div>
            <div className="settings-model-item-actions">
              <button
                className="settings-model-item-delete"
                onClick={() => {
                  onDelete(anim.filename);
                  setAnimations((prev) =>
                    prev.filter((a) => a.filename !== anim.filename),
                  );
                }}
              >
                {locale().ui_model_delete}
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="settings-model-item-loading">Loading...</div>
        )}

        {!loading && animations.length === 0 && !adding && (
          <div className="settings-model-item-loading">
            {locale().ui_vrm_sublabel.replace(".vrm", ".vrma")}
          </div>
        )}
      </div>

      {/* Add form */}
      {adding && pendingFile && (
        <div className="settings-anim-add-form">
          <div className="settings-model-item-name" style={{ marginBottom: 8 }}>
            {pendingFile.name}
          </div>
          <input
            type="text"
            className="settings-text-input"
            placeholder={locale().ui_trigger_placeholder}
            value={triggerText}
            onChange={(e) => setTriggerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && triggerText.trim()) handleConfirmAdd();
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <button className="settings-btn" onClick={handleCancelAdd}>
              {locale().ui_settings_close}
            </button>
            <button
              className="settings-btn primary"
              disabled={!triggerText.trim()}
              onClick={handleConfirmAdd}
            >
              {locale().ui_add_animation}
            </button>
          </div>
        </div>
      )}

      {!adding && (
        <div className="settings-row" style={{ justifyContent: "flex-end" }}>
          <button
            className="settings-btn primary"
            onClick={() => animFileInputRef.current?.click()}
          >
            {locale().ui_add_animation}
          </button>
          <input
            ref={animFileInputRef}
            type="file"
            accept=".vrma"
            className="settings-file-input"
            onChange={handleFileSelect}
          />
        </div>
      )}
    </div>
  );
}

// ---------- Voice Provider ----------

const VOICE_PROVIDER_LABELS: Record<VoiceProvider, string> = {
  disabled: "Off",
  fish_s2_pro: "Fish S2-Pro",
  piper_http: "Piper HTTP",
  openai_compatible_speech: "OpenAI-compatible",
  custom_http_json: "Custom JSON HTTP",
};

function VoiceProviderSettings({ isOpen }: { isOpen: boolean }) {
  const [settings, setSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [sampleText, setSampleText] = useState("Hey, I'm here.");
  const [status, setStatus] = useState("");
  const previewRef = useRef<VoiceManager | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadVoiceSettings());
    }
  }, [isOpen]);

  const updateSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = normalizeVoiceSettings({ ...prev, ...partial });
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  const handlePreview = useCallback(async () => {
    previewRef.current ??= new VoiceManager();
    setStatus("Testing...");
    await previewRef.current.speak(sampleText);
    setStatus("Sample sent");
    window.setTimeout(() => setStatus(""), 2500);
  }, [sampleText]);

  const providerEnabled = settings.provider !== "disabled";
  const needsApiKey =
    settings.provider === "fish_s2_pro" ||
    settings.provider === "openai_compatible_speech";
  const usesModel =
    settings.provider === "fish_s2_pro" ||
    settings.provider === "openai_compatible_speech";

  return (
    <div className="settings-card">
      <div className="settings-card-title">Voice</div>
      <div className="settings-row">
        <span className="settings-row-label">Provider</span>
        <select
          className="settings-select"
          value={settings.provider}
          onChange={(e) => updateSettings({
            ...DEFAULT_VOICE_SETTINGS,
            provider: e.target.value as VoiceProvider,
          })}
        >
          {Object.entries(VOICE_PROVIDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {providerEnabled && (
        <>
          <div className="settings-row">
            <span className="settings-row-label">Endpoint</span>
            <input
              className="settings-text-input compact"
              value={settings.endpoint}
              placeholder={
                settings.provider === "fish_s2_pro"
                  ? "https://api.fish.audio/v1/tts"
                  : "http://127.0.0.1:5000"
              }
              onChange={(e) => updateSettings({ endpoint: e.target.value })}
            />
          </div>

          {needsApiKey && (
            <div className="settings-row">
              <span className="settings-row-label">API key</span>
              <input
                className="settings-text-input compact"
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
              />
            </div>
          )}

          <div className="settings-row">
            <span className="settings-row-label">
              Voice
              <div className="settings-row-sublabel">
                Reference ID, voice name, or speaker name
              </div>
            </span>
            <input
              className="settings-text-input compact"
              value={settings.voiceId}
              onChange={(e) => updateSettings({ voiceId: e.target.value })}
            />
          </div>

          {usesModel && (
            <div className="settings-row">
              <span className="settings-row-label">Model</span>
              <input
                className="settings-text-input compact"
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
              />
            </div>
          )}

          <div className="settings-row">
            <span className="settings-row-label">Format</span>
            <select
              className="settings-select"
              value={settings.format}
              onChange={(e) => updateSettings({ format: e.target.value })}
            >
              <option value="mp3">mp3</option>
              <option value="wav">wav</option>
              <option value="opus">opus</option>
            </select>
          </div>

          <div className="settings-row">
            <span className="settings-row-label">Speed</span>
            <input
              className="settings-slider"
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={settings.speed}
              onChange={(e) => updateSettings({ speed: Number(e.target.value) })}
            />
          </div>

          {settings.provider === "custom_http_json" && (
            <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <span className="settings-row-label">JSON body</span>
              <textarea
                className="settings-textarea"
                value={settings.customBodyTemplate}
                placeholder='{"text":"{{text}}","voice":"{{voiceId}}"}'
                onChange={(e) => updateSettings({ customBodyTemplate: e.target.value })}
              />
            </div>
          )}

          <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <span className="settings-row-label">Sample</span>
            <div className="settings-inline-controls">
              <input
                className="settings-text-input compact"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
              />
              <button className="settings-btn primary" onClick={handlePreview}>
                Test
              </button>
            </div>
            {status && <span className="settings-status-message">{status}</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Types ----------

export type CommentFrequency = "off" | "low" | "medium" | "high";

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;

  // Character
  currentModelName: string;
  onModelChange: (file: File) => void;
  onModelSwitch: (filename: string) => void;
  onModelDelete: (filename: string) => void;

  // Custom Animations
  onCustomAnimationAdd: (file: File, triggerText: string) => void;
  onCustomAnimationDelete: (filename: string) => void;

  // Behavior
  commentFrequency: CommentFrequency;
  onCommentFrequencyChange: (freq: CommentFrequency) => void;

  // Privacy
  privacySettings: PrivacySettings;
  onPrivacySettingsChange: (partial: Partial<PrivacySettings>) => void;

  // Setup Wizard
  onOpenSetupWizard?: () => void;
}

// ---------- Constants ----------

const APP_VERSION = "0.1.0-alpha";

// ---------- Component ----------

export default function Settings({
  isOpen,
  onClose,
  currentModelName,
  onModelChange,
  onModelSwitch,
  onModelDelete,
  onCustomAnimationAdd,
  onCustomAnimationDelete,
  commentFrequency,
  onCommentFrequencyChange,
  privacySettings,
  onPrivacySettingsChange,
  onOpenSetupWizard,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Handlers ----------

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith(".vrm")) {
        onModelChange(file);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [onModelChange],
  );

  return (
    <div className={`settings-overlay ${isOpen ? "open" : ""}`}>
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <span className="settings-title">{locale().ui_settings_title}</span>
          <button className="settings-close-btn" onClick={onClose}>
            {locale().ui_settings_close}
          </button>
        </div>

        {/* ============ Character ============ */}
        <div className="settings-card">
          <div className="settings-card-title">{locale().ui_character_title}</div>

          <div className="settings-row">
            <div className="settings-row-label">
              {locale().ui_vrm_model}
              <div className="settings-row-sublabel">
                {locale().ui_vrm_sublabel}
              </div>
            </div>
          </div>

          <ModelList
            currentModelName={currentModelName}
            onModelSwitch={onModelSwitch}
            onModelDelete={onModelDelete}
            isOpen={isOpen}
          />

          <div className="settings-row" style={{ justifyContent: "flex-end" }}>
            <button
              className="settings-btn primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {locale().ui_model_add}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".vrm"
              className="settings-file-input"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* ============ Model Prep ============ */}
        <ModelPrepPanel />

        {/* ============ Custom Animations ============ */}
        <CustomAnimationList
          onAdd={onCustomAnimationAdd}
          onDelete={onCustomAnimationDelete}
          isOpen={isOpen}
        />

        {/* ============ Voice ============ */}
        <VoiceProviderSettings isOpen={isOpen} />

        {/* ============ Behavior ============ */}
        <BehaviorSettings
          commentFrequency={commentFrequency}
          onCommentFrequencyChange={onCommentFrequencyChange}
        />

        {/* ============ Privacy ============ */}
        <PrivacySettingsCard
          privacySettings={privacySettings}
          onPrivacySettingsChange={onPrivacySettingsChange}
        />

        {/* ============ OpenClaw Connection ============ */}
        <OpenClawSettings isOpen={isOpen} onOpenSetupWizard={onOpenSetupWizard} />

        {/* ============ System ============ */}
        <div className="settings-card">
          <div className="settings-card-title">{locale().ui_system_title}</div>

          {/* Language selector */}
          <div className="settings-row">
            <span className="settings-row-label">{locale().ui_language}</span>
            <select
              className="settings-select"
              value={getLocaleCode()}
              onChange={async (e) => {
                await setLocale(e.target.value as SupportedLocale);
                window.location.reload();
              }}
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <AutostartToggle />

          <div className="settings-row">
            <span className="settings-row-label">{locale().ui_resource_usage}</span>
            <ResourceUsage isOpen={isOpen} />
          </div>

          <div className="settings-row">
            <span className="settings-row-label">{locale().ui_app_version}</span>
            <span className="settings-row-value">{APP_VERSION}</span>
          </div>
        </div>

        {/* Version footer */}
        <div className="settings-version">
          NightClaw {APP_VERSION}
        </div>
      </div>
    </div>
  );
}
