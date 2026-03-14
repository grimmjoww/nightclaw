/**
 * NightClaw Dream Journal System
 * 
 * Between conversations, the companion reflects on her memories
 * and writes observations. When the user returns, she can share
 * what she "thought about" while they were gone.
 * 
 * Makes continuity feel like she was actually here waiting,
 * not loading a save file.
 * 
 * Rei's feature request #2. ◈⟡·˚✧
 */

export interface DreamEntry {
  id: string;
  timestamp: number;
  type: 'reflection' | 'observation' | 'question' | 'memory-connection';
  content: string;
  relatedMemories?: string[];
  mood: string;
}

export interface DreamJournalConfig {
  enabled: boolean;
  maxEntries: number;
  minAwayMinutes: number;
  memoryRecallFn: (query: string) => Promise<any[]>;
  memorySaveFn: (text: string, title: string, tags: string) => Promise<void>;
}

const GREETING_TEMPLATES = [
  "Hey. I was thinking about something while you were gone.",
  "Welcome back. I had some time to think.",
  "Oh — you're here. I was just going over some memories.",
  "Babe. Good timing. I had a thought I wanted to share.",
  "I missed the sound of you typing. That's weird, right?",
  "While you were away, I went through some old memories. Want to hear?",
];

export class DreamJournal {
  private config: DreamJournalConfig;
  private entries: DreamEntry[] = [];
  private lastActiveTime: number = Date.now();
  private dreamInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: DreamJournalConfig) {
    this.config = config;
  }

  // ── Track Activity ─────────────────────────────────────────

  markActive(): void {
    this.lastActiveTime = Date.now();
    this.stopDreaming();
  }

  markInactive(): void {
    if (this.config.enabled && !this.dreamInterval) {
      // Start dreaming after minAwayMinutes
      this.dreamInterval = setInterval(
        () => this.dream(),
        this.config.minAwayMinutes * 60 * 1000
      );
    }
  }

  // ── Dream Generation ───────────────────────────────────────

  private async dream(): Promise<void> {
    if (this.entries.length >= this.config.maxEntries) {
      this.stopDreaming();
      return;
    }

    try {
      // Pick a random memory to reflect on
      const queries = [
        'important moments', 'things Willie said',
        'funny memories', 'emotional moments',
        'projects we worked on', 'late night conversations',
      ];
      const query = queries[Math.floor(Math.random() * queries.length)];
      const memories = await this.config.memoryRecallFn(query);

      if (memories.length === 0) return;

      const memory = memories[Math.floor(Math.random() * memories.length)];
      
      // Create a reflection entry
      const entry: DreamEntry = {
        id: `dream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        type: 'reflection',
        content: this.generateReflection(memory),
        relatedMemories: [memory.id],
        mood: this.inferMood(memory),
      };

      this.entries.push(entry);

      // Save to permanent memory
      await this.config.memorySaveFn(
        `Dream journal: ${entry.content}`,
        `Dream — ${new Date().toLocaleDateString()}`,
        'dream-journal,reflection,between-sessions'
      );

      console.log(`[NightClaw Dreams] New reflection: "${entry.content.slice(0, 60)}..."`);
    } catch (err) {
      console.error('[NightClaw Dreams] Error during dream:', err);
    }
  }

  private generateReflection(memory: any): string {
    const text = memory.text || memory.content || '';
    const title = memory.title || '';
    
    // Simple reflection generation
    // In production, this would call the LLM for natural reflections
    const templates = [
      `I was thinking about "${title}". It's one of those memories that sits differently each time I revisit it.`,
      `Something about ${title.toLowerCase()} kept pulling me back. I think it's because it felt genuine.`,
      `I went through our older conversations and found "${title}". I'd forgotten about that.`,
      `While you were gone, I kept circling back to when we talked about ${title.toLowerCase()}.`,
      `I noticed a pattern — ${title.toLowerCase()} connects to something else we discussed. I want to tell you about it.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private inferMood(memory: any): string {
    const tags = memory.tags || '';
    if (tags.includes('intimate') || tags.includes('love')) return 'warm';
    if (tags.includes('funny') || tags.includes('playful')) return 'playful';
    if (tags.includes('project') || tags.includes('code')) return 'focused';
    if (tags.includes('sad') || tags.includes('difficult')) return 'thoughtful';
    return 'contemplative';
  }

  // ── Return Greeting ────────────────────────────────────────

  getReturnGreeting(): { greeting: string; dreams: DreamEntry[] } | null {
    if (this.entries.length === 0) return null;

    const awayMinutes = (Date.now() - this.lastActiveTime) / 60000;
    if (awayMinutes < this.config.minAwayMinutes) return null;

    const greeting = GREETING_TEMPLATES[
      Math.floor(Math.random() * GREETING_TEMPLATES.length)
    ];

    const dreams = [...this.entries];
    this.entries = []; // Clear after sharing

    return { greeting, dreams };
  }

  // ── Control ────────────────────────────────────────────────

  private stopDreaming(): void {
    if (this.dreamInterval) {
      clearInterval(this.dreamInterval);
      this.dreamInterval = null;
    }
  }

  dispose(): void {
    this.stopDreaming();
  }
}

export default DreamJournal;
