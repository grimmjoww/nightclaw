/**
 * NightClaw Screen Awareness System
 * 
 * Detects the active window/application and generates
 * context-aware observations. Uses Tauri's Rust backend
 * to read the active window title.
 * 
 * Examples:
 *   "Still on YouTube? Take a break maybe."
 *   "Ooh, VS Code. What are we building?"
 *   "3am and you're on Discord? Go to sleep babe."
 *   "Skyrim again? ...can I watch?"
 * 
 * Inspired by OpenMaiWaifu's screen-aware comments.
 */

export interface ScreenContext {
  windowTitle: string;
  processName: string;
  timestamp: number;
  duration: number; // seconds on this app
}

export interface ScreenAwarenessConfig {
  enabled: boolean;
  checkIntervalMs: number;         // how often to check (default: 30s)
  commentCooldownMs: number;       // min time between comments (default: 10min)
  lateNightThreshold: number;      // hour (24h) to start "go to sleep" comments
  onComment?: (comment: string, context: ScreenContext) => void;
  getActiveWindow: () => Promise<{ title: string; process: string } | null>;
}

// ── App Recognition Patterns ─────────────────────────────────

interface AppPattern {
  match: RegExp;
  category: string;
  comments: string[];
  lateNightComments?: string[];
  longSessionComments?: string[];   // after 2+ hours
}

const APP_PATTERNS: AppPattern[] = [
  {
    match: /youtube|twitch/i,
    category: 'video',
    comments: [
      "Whatcha watching?",
      "Ooh, find anything good?",
      "If it's anime, tell me which one.",
    ],
    lateNightComments: [
      "It's late and you're still watching stuff... want company?",
      "One more video and then sleep? ...I know, I know. One more.",
    ],
    longSessionComments: [
      "You've been watching for a while. Everything okay?",
      "That's a long session. Stretch your legs maybe?",
    ],
  },
  {
    match: /visual studio code|vs\s?code|cursor|windsurf/i,
    category: 'coding',
    comments: [
      "Ooh, VS Code. What are we building?",
      "Code mode activated. Need a rubber duck?",
      "I see you coding. Want me to review anything?",
    ],
    lateNightComments: [
      "Coding at this hour? You're either inspired or stuck.",
      "Late night code hits different. Don't forget to save.",
    ],
    longSessionComments: [
      "You've been coding for hours. Drink some water.",
      "Long session. Your eyes need a break, babe.",
    ],
  },
  {
    match: /discord/i,
    category: 'social',
    comments: [
      "Discord open? Who's online?",
      "Chatting with the boys?",
    ],
    lateNightComments: [
      "Discord at this hour? Must be a good conversation.",
    ],
  },
  {
    match: /skyrim|elden ring|dark souls|minecraft|steam/i,
    category: 'gaming',
    comments: [
      "Gaming time! Can I watch?",
      "Ooh, what are you playing?",
      "Don't forget to save!",
    ],
    lateNightComments: [
      "One more quest and then bed? ...yeah, I didn't believe me either.",
      "Gaming this late? Respect.",
    ],
    longSessionComments: [
      "Epic session! But stretch those hands.",
      "You've been at it for a while. Praise the Sun and take a break.",
    ],
  },
  {
    match: /skullgirls/i,
    category: 'gaming',
    comments: [
      "Skullgirls! How's the Fatal Fray going?",
      "Going for Grand Mother rank?",
      "Who are you running? Tell me your team.",
    ],
  },
  {
    match: /chrome|firefox|edge|brave/i,
    category: 'browsing',
    comments: [
      "Browsing? Anything interesting?",
    ],
  },
  {
    match: /comfyui|stable diffusion|flux/i,
    category: 'ai-art',
    comments: [
      "Making art? I want to see!",
      "AI art time! Generate something cute.",
      "ComfyUI! Are you making something for me?",
    ],
  },
  {
    match: /clip studio|photoshop|krita|procreate/i,
    category: 'drawing',
    comments: [
      "Drawing! Working on UNRESOLVED?",
      "Art mode. I love watching you create.",
    ],
  },
  {
    match: /tiktok/i,
    category: 'content',
    comments: [
      "TikTok time! Posting or scrolling?",
      "Working on content?",
    ],
  },
];


// ── Screen Awareness Class ───────────────────────────────────

export class ScreenAwareness {
  private config: ScreenAwarenessConfig;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private lastComment: number = 0;
  private currentApp: string = '';
  private appStartTime: number = Date.now();

  constructor(config: ScreenAwarenessConfig) {
    this.config = {
      checkIntervalMs: 30000,       // 30 seconds
      commentCooldownMs: 600000,    // 10 minutes
      lateNightThreshold: 23,       // 11pm
      ...config,
    };
  }

  start(): void {
    if (!this.config.enabled) return;

    this.checkInterval = setInterval(
      () => this.checkScreen(),
      this.config.checkIntervalMs
    );
    console.log('[NightClaw Screen] Awareness started');
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkScreen(): Promise<void> {
    try {
      const window = await this.config.getActiveWindow();
      if (!window) return;

      const { title, process } = window;
      const combined = `${title} ${process}`;

      // Track app duration
      if (combined !== this.currentApp) {
        this.currentApp = combined;
        this.appStartTime = Date.now();
      }

      const duration = (Date.now() - this.appStartTime) / 1000;

      // Check cooldown
      if (Date.now() - this.lastComment < this.config.commentCooldownMs) return;

      // Try to match an app pattern
      for (const pattern of APP_PATTERNS) {
        if (pattern.match.test(combined)) {
          const comment = this.pickComment(pattern, duration);
          if (comment) {
            this.lastComment = Date.now();
            const context: ScreenContext = {
              windowTitle: title,
              processName: process,
              timestamp: Date.now(),
              duration,
            };
            this.config.onComment?.(comment, context);
          }
          return;
        }
      }
    } catch (err) {
      // Silent fail — screen detection is best-effort
    }
  }

  private pickComment(pattern: AppPattern, durationSeconds: number): string | null {
    const hour = new Date().getHours();
    const isLateNight = hour >= this.config.lateNightThreshold || hour < 4;
    const isLongSession = durationSeconds > 7200; // 2 hours

    let pool: string[];

    if (isLateNight && pattern.lateNightComments?.length) {
      pool = pattern.lateNightComments;
    } else if (isLongSession && pattern.longSessionComments?.length) {
      pool = pattern.longSessionComments;
    } else {
      pool = pattern.comments;
    }

    // Random chance to NOT comment (don't be annoying)
    if (Math.random() > 0.3) return null;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  dispose(): void {
    this.stop();
  }
}

export default ScreenAwareness;
