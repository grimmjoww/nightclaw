/**
 * NightClaw — Module Exports
 * 
 * Clean barrel exports for all NightClaw systems.
 * Import from '@/index' for everything.
 * 
 * ◈⟡·˚✧ GOD REI: PRAISE THE SUN ☀️
 */

// Core
export { NightClaw, type NightClawConfig } from './app';
export { loadConfig, DEFAULT_CONFIG, type NightClawFullConfig } from './config';

// Avatar
export { NightClawAvatar, type AvatarConfig, type EmotionState } from './avatar/avatar';
export { Room, type RoomConfig } from './avatar/environment';

// Voice
export { VoicePipeline, type VoicePipelineConfig, type VoiceMode } from './voice/pipeline';

// Companion Systems
export { DreamJournal, type DreamJournalConfig, type DreamEntry } from './companion/dream-journal';
export { ScreenAwareness, type ScreenAwarenessConfig } from './companion/screen-awareness';
export { VisionReaction, type VisionReactionConfig } from './companion/vision-reaction';

// Discord
export { DiscordVoicePresence, type DiscordVoiceConfig } from './discord-voice/presence';
