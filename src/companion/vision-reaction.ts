/**
 * NightClaw Vision Reaction System
 * 
 * When Willie shares an image or screenshot, the avatar reacts
 * BEFORE the text response arrives. Face responds to vision input
 * with a slight delay, like a real person processing what they see.
 * 
 * Uses Ollama vision model to analyze images, then maps the
 * analysis to avatar expressions.
 * 
 * Rei's feature request #3. ◈⟡·˚✧
 */

import type { EmotionState } from '../avatar/avatar';

export interface VisionReactionConfig {
  ollamaUrl: string;          // Ollama API endpoint
  visionModel: string;        // e.g. 'llava', 'bakllava'
  reactionDelayMs: number;    // delay before avatar reacts (natural feel)
  onReaction?: (emotion: EmotionState, description: string) => void;
}

// ── Quick emotion classification from vision description ─────

interface VisionCue {
  keywords: string[];
  emotion: EmotionState;
}

const VISION_CUES: VisionCue[] = [
  {
    keywords: ['cute', 'adorable', 'kawaii', 'pretty', 'beautiful'],
    emotion: { primary: 'happy', intensity: 0.8 },
  },
  {
    keywords: ['funny', 'meme', 'joke', 'laugh', 'silly'],
    emotion: { primary: 'happy', intensity: 0.9 },
  },
  {
    keywords: ['sexy', 'hot', 'nsfw', 'lingerie', 'nude'],
    emotion: { primary: 'flustered', intensity: 0.8 },
  },
  {
    keywords: ['scary', 'horror', 'creepy', 'dark', 'disturbing'],
    emotion: { primary: 'surprised', intensity: 0.7 },
  },
  {
    keywords: ['sad', 'crying', 'depressing', 'loss', 'grief'],
    emotion: { primary: 'sad', intensity: 0.6 },
  },
  {
    keywords: ['code', 'programming', 'terminal', 'ide', 'debug'],
    emotion: { primary: 'thinking', intensity: 0.6 },
  },
  {
    keywords: ['anime', 'manga', 'character', 'drawing', 'art'],
    emotion: { primary: 'excited', intensity: 0.7 },
  },
  {
    keywords: ['food', 'cooking', 'recipe', 'delicious', 'meal'],
    emotion: { primary: 'happy', intensity: 0.6 },
  },
  {
    keywords: ['error', 'bug', 'crash', 'fail', 'broken'],
    emotion: { primary: 'concerned', intensity: 0.5, secondary: 'thinking', secondaryIntensity: 0.3 },
  },
];


// ── Vision Reaction Class ────────────────────────────────────

export class VisionReaction {
  private config: VisionReactionConfig;

  constructor(config: VisionReactionConfig) {
    this.config = {
      ollamaUrl: 'http://127.0.0.1:11434',
      visionModel: 'llava',
      reactionDelayMs: 800,
      ...config,
    };
  }

  /**
   * Analyze an image and trigger an avatar reaction.
   * Returns the emotion to display and a short description.
   */
  async react(imageBase64: string): Promise<{ emotion: EmotionState; description: string }> {
    // Step 1: Quick reaction delay (feels natural)
    await this.delay(this.config.reactionDelayMs);

    try {
      // Step 2: Send to Ollama vision model
      const description = await this.analyzeImage(imageBase64);

      // Step 3: Map description to emotion
      const emotion = this.classifyEmotion(description);

      // Step 4: Trigger callback
      this.config.onReaction?.(emotion, description);

      return { emotion, description };
    } catch (err) {
      console.error('[NightClaw Vision] Analysis failed:', err);
      // Default to curious/interested expression on failure
      const fallback: EmotionState = { primary: 'thinking', intensity: 0.5 };
      return { emotion: fallback, description: 'I couldn\'t quite make that out...' };
    }
  }

  /**
   * Let the companion see herself (self-awareness via vision).
   * Captures the avatar canvas and analyzes it.
   */
  async seeMyself(avatarCanvas: HTMLCanvasElement): Promise<string> {
    const dataUrl = avatarCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];

    const response = await this.queryOllama(
      base64,
      'Describe this anime character\'s appearance in detail. ' +
      'What do they look like? Hair color, eye color, outfit, expression? ' +
      'Do you like how they look? Give your honest opinion.'
    );

    return response;
  }

  /**
   * Browse avatar options and pick a preference.
   */
  async chooseAvatar(options: Array<{ name: string; imageBase64: string }>): Promise<{
    choice: string;
    reason: string;
  }> {
    const descriptions: string[] = [];

    for (const option of options) {
      const desc = await this.analyzeImage(option.imageBase64);
      descriptions.push(`${option.name}: ${desc}`);
    }

    // Use LLM to pick (this would go through the agent in production)
    // For now, return the analysis for each
    return {
      choice: options[0]?.name || 'default',
      reason: `Analyzed ${options.length} options: ${descriptions.join('; ')}`,
    };
  }

  // ── Ollama Integration ─────────────────────────────────────

  private async analyzeImage(imageBase64: string): Promise<string> {
    return this.queryOllama(
      imageBase64,
      'Describe this image briefly in one sentence. Focus on the mood, content, and anything notable.'
    );
  }

  private async queryOllama(imageBase64: string, prompt: string): Promise<string> {
    const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.visionModel,
        prompt,
        images: [imageBase64],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  // ── Emotion Classification ─────────────────────────────────

  private classifyEmotion(description: string): EmotionState {
    const lower = description.toLowerCase();

    for (const cue of VISION_CUES) {
      for (const keyword of cue.keywords) {
        if (lower.includes(keyword)) {
          return cue.emotion;
        }
      }
    }

    // Default: mildly interested
    return { primary: 'neutral', intensity: 0.5 };
  }

  // ── Utility ────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default VisionReaction;
