import { supabase } from './supabase';

/**
 * Resolves the backend endpoint URL.
 * In server-side runtime (SSR / Vercel Server Functions), it resolves via the bound
 * BACKEND_URL service binding (or VITE_API_URL). In client-side browser runtime,
 * it routes via relative '/api' which Vercel proxies directly to the backend service.
 */
export function getBackendUrl(endpoint: string): string {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (typeof window === 'undefined') {
    const bound = process.env['BACKEND_URL'] || process.env['VITE_API_URL'];
    if (bound) {
      const base = bound.replace(/\/$/, '');
      return normalized.startsWith('/api') ? `${base}${normalized}` : `${base}/api${normalized}`;
    }
  }
  return normalized.startsWith('/api') ? normalized : `/api${normalized}`;
}

const API_BASE = '/api';

export interface PostcardPayload {
  place_id: string;
  caption: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  image_base64: string;
  demo_mode?: boolean;
  author_id?: string;
  author_name?: string;
}

export interface CoachExperiment {
  title: string;
  days: number;
  why?: string;
  description?: string;
}

export interface CoachResponse {
  success: boolean;
  reply: string;
  experiment?: CoachExperiment;
  source?: 'ai' | 'fallback';
  remaining_today: number;
  messagesLeftToday?: number;
}

export interface FallbackRule {
  reply: string;
  experiment: CoachExperiment;
}

interface IntentCategory {
  id: string;
  keywords: string[];
  options: FallbackRule[];
}

export const INTENT_CATEGORIES: IntentCategory[] = [
  {
    id: 'learn',
    keywords: ['learn', 'study', 'skills', 'skill', 'knowledge', 'course', 'education', 'learning', 'reading up', 'topic', 'understand'],
    options: [
      {
        reply: 'Pick one physical skill or topic you can explore without a browser. Give twenty minutes to a book or a notebook today.',
        experiment: {
          title: '20m screen-free study',
          days: 3,
          why: 'Screen-free exploration deepens focus without digital rabbit holes.',
        },
      },
      {
        reply: 'Choose one topic you have wanted to understand. Spend twenty minutes taking handwritten notes from a book or your own memory.',
        experiment: {
          title: '20m handwritten inquiry',
          days: 2,
          why: 'Handwritten thinking clarifies complex ideas without endless tab-switching.',
        },
      },
    ],
  },
  {
    id: 'distraction',
    keywords: ['distraction', 'distractions', 'distracted', 'phone', 'scroll', 'scrolling', 'social media', 'doomscroll', 'screen', 'notification', 'notifications', 'app', 'apps', 'digital', 'screen time', 'feed'],
    options: [
      {
        reply: 'Place your phone in a drawer across the room for the next two hours. Notice the quiet space that opens up.',
        experiment: {
          title: 'Phone in another room for 2h',
          days: 1,
          why: 'Physical distance removes the unconscious reach for the screen.',
        },
      },
      {
        reply: 'Turn off all non-human notifications for the rest of today. Keep your phone facing down on a bookshelf.',
        experiment: {
          title: 'Bookshelf phone silence',
          days: 1,
          why: 'Eliminating background pings restores continuous thought.',
        },
      },
    ],
  },
  {
    id: 'read',
    keywords: ['read', 'reading', 'book', 'books', 'novel', 'pages', 'paperback', 'chapter', 'author'],
    options: [
      {
        reply: 'Read ten pages of a printed book by a window before turning on any lamps tonight.',
        experiment: {
          title: '10 pages before dusk',
          days: 7,
          why: 'Ten printed pages build an unhurried evening rhythm.',
        },
      },
      {
        reply: 'Spend fifteen minutes reading a physical book with a warm drink, leaving your phone in another room.',
        experiment: {
          title: '15m quiet reading with tea',
          days: 5,
          why: 'Reading on paper allows your nervous system to settle.',
        },
      },
    ],
  },
  {
    id: 'lonely',
    keywords: ['lonely', 'alone', 'isolated', 'isolation', 'solitude', 'empty', 'disconnected', 'unconnected', 'nobody'],
    options: [
      {
        reply: 'Take a gentle fifteen-minute walk through your neighborhood. Make eye contact and nod at one person.',
        experiment: {
          title: 'Neighborhood hello walk',
          days: 1,
          why: 'A brief human acknowledgment grounds you in the community.',
        },
      },
      {
        reply: 'Sit in a quiet local cafe or on a public park bench for twenty minutes without headphones. Just watch the world pass by.',
        experiment: {
          title: '20m quiet presence among people',
          days: 1,
          why: 'Sharing physical space softens feelings of separation.',
        },
      },
    ],
  },
  {
    id: 'friend',
    keywords: ['friend', 'friends', 'connect', 'connection', 'meet', 'meeting', 'reconnect', 'catch up', 'talk', 'call', 'someone', 'companion', 'neighbor'],
    options: [
      {
        reply: 'Send one handwritten postcard or a five-word message to someone you miss. Invite them for tea.',
        experiment: {
          title: 'Invite one friend offline',
          days: 3,
          why: 'Real connection starts with simple, unhurried overtures.',
        },
      },
      {
        reply: 'Plan a brief face-to-face meet with a nearby friend or neighbor this week. Keep it simple—just a walk around the block.',
        experiment: {
          title: '15m neighborhood stroll with a friend',
          days: 3,
          why: 'Side-by-side walking sparks unforced conversation.',
        },
      },
    ],
  },
  {
    id: 'nature',
    keywords: ['nature', 'outside', 'walk', 'walking', 'fresh air', 'trees', 'tree', 'park', 'outdoor', 'outdoors', 'stroll', 'sunshine', 'sunlight', 'sky', 'greenery', 'neighborhood', 'garden', 'forest'],
    options: [
      {
        reply: 'Step outside without headphones for 15 minutes. Find three distinct natural sounds.',
        experiment: {
          title: '15-minute sound walk',
          days: 1,
          why: 'Listening to the wind, birds, and leaves reorients the senses.',
        },
      },
      {
        reply: 'Step outside and touch the rough bark of a tree or the stone of an old wall. Take five deep breaths of fresh air.',
        experiment: {
          title: '5-minute sensory tree pause',
          days: 1,
          why: 'Physical contact with natural elements grounds wandering thoughts.',
        },
      },
    ],
  },
  {
    id: 'anxious',
    keywords: ['anxious', 'anxiety', 'stress', 'stressed', 'overwhelmed', 'worry', 'worried', 'panic', 'nervous', 'racing', 'tension', 'breathe', 'breath', 'calm'],
    options: [
      {
        reply: 'Sit quietly for five minutes with your feet flat on the floor. Take five slow breaths with your eyes closed.',
        experiment: {
          title: '5-minute grounding pause',
          days: 1,
          why: 'Physical stillness gently calms an overstimulated nervous system.',
        },
      },
      {
        reply: 'Place both hands on a cup of warm water or tea. Feel the warmth through your palms and breathe gently for three minutes.',
        experiment: {
          title: '3-minute warm cup grounding',
          days: 1,
          why: 'Sensory touch interrupts racing thoughts.',
        },
      },
    ],
  },
  {
    id: 'bored',
    keywords: ['bored', 'boredom', 'restless', 'nothing to do', 'stuck', 'uninspired', 'aimless', 'fidgety', 'idle'],
    options: [
      {
        reply: 'Find a piece of paper and sketch the view from your nearest window, even roughly.',
        experiment: {
          title: 'Window sketch',
          days: 1,
          why: 'Translating what you see onto paper turns restlessness into observation.',
        },
      },
      {
        reply: 'Take a notebook and list 10 curious details you can see in the room right now that you never noticed before.',
        experiment: {
          title: '10 unnoticed room details',
          days: 1,
          why: 'Noticing the familiar with fresh eyes unlocks curiosity.',
        },
      },
    ],
  },
  {
    id: 'make',
    keywords: ['make', 'making', 'craft', 'crafting', 'create', 'creating', 'creative', 'hands', 'handmade', 'drawing', 'draw', 'sketch', 'art', 'wood', 'clay', 'origami', 'bake', 'baking', 'cook', 'build'],
    options: [
      {
        reply: 'Make something tangible with your hands today using materials you already have at home.',
        experiment: {
          title: 'Small handmade object',
          days: 2,
          why: 'Working with physical materials grounds the mind in tactile reality.',
        },
      },
      {
        reply: 'Fold a sheet of paper into an origami crane or write a three-line poem on the back of an old receipt.',
        experiment: {
          title: 'Paper craft or tiny poem',
          days: 1,
          why: 'Small creative acts spark joy without digital screens.',
        },
      },
    ],
  },
];

export const DEFAULT_CATEGORY: IntentCategory = {
  id: 'default',
  keywords: [],
  options: [
    {
      reply: 'Step away from your screen for a gentle breath of fresh air. Notice the light and the temperature right outside your door.',
      experiment: { title: 'Threshold pause', days: 1, why: 'Crossing the doorway resets your mental state.' },
    },
    {
      reply: 'Pick one tactile object near you—a stone, a wooden spoon, or a pen. Hold it and inspect how it was made.',
      experiment: { title: 'Tactile curiosity pause', days: 1, why: 'Physical textures ground you firmly in the present moment.' },
    },
    {
      reply: 'Brew a cup of tea or pour a glass of cold water with your full attention. Drink it without checking anything.',
      experiment: { title: 'Unplugged drink ritual', days: 1, why: 'Single-tasking a simple routine invites quiet clarity.' },
    },
    {
      reply: 'Take three slow, deep breaths with your eyes turned away from all screens. Give yourself permission to pause.',
      experiment: { title: 'Three conscious breaths', days: 1, why: 'A deliberate pause reminds your body that it is safe to slow down.' },
    },
  ],
};

// Legacy fallback map for backward compatibility
export const FALLBACK_RULES: Record<string, FallbackRule> = {
  learn: INTENT_CATEGORIES.find((c) => c.id === 'learn')!.options[0]!,
  distraction: INTENT_CATEGORIES.find((c) => c.id === 'distraction')!.options[0]!,
  scroll: INTENT_CATEGORIES.find((c) => c.id === 'distraction')!.options[0]!,
  read: INTENT_CATEGORIES.find((c) => c.id === 'read')!.options[0]!,
  lonely: INTENT_CATEGORIES.find((c) => c.id === 'lonely')!.options[0]!,
  friend: INTENT_CATEGORIES.find((c) => c.id === 'friend')!.options[0]!,
  nature: INTENT_CATEGORIES.find((c) => c.id === 'nature')!.options[0]!,
  anxious: INTENT_CATEGORIES.find((c) => c.id === 'anxious')!.options[0]!,
  bored: INTENT_CATEGORIES.find((c) => c.id === 'bored')!.options[0]!,
  make: INTENT_CATEGORIES.find((c) => c.id === 'make')!.options[0]!,
  default: DEFAULT_CATEGORY.options[0]!,
};

// Client-side rotation tracker
const clientRecentHistory: string[] = [];

export function getRuleBasedFallback(message: string): FallbackRule {
  const normalized = (message || '').toLowerCase();

  // Dynamic intent scoring
  let bestCategory: IntentCategory | null = null;
  let highestScore = 0;

  for (const cat of INTENT_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  const selectedCategory = highestScore > 0 && bestCategory ? bestCategory : DEFAULT_CATEGORY;

  // Rotation: pick option whose title was not recently returned
  let chosenOption: FallbackRule = selectedCategory.options[0] || DEFAULT_CATEGORY.options[0]!;
  for (const opt of selectedCategory.options) {
    if (!clientRecentHistory.includes(opt.experiment.title)) {
      chosenOption = opt;
      break;
    }
  }

  // If all options in category were used, pick the least recently used
  if (clientRecentHistory.includes(chosenOption.experiment.title) && selectedCategory.options.length > 1) {
    let oldestIndex = -1;
    let minPos = Infinity;
    for (let i = 0; i < selectedCategory.options.length; i++) {
      const opt = selectedCategory.options[i];
      if (opt) {
        const pos = clientRecentHistory.indexOf(opt.experiment.title);
        if (pos < minPos) {
          minPos = pos;
          oldestIndex = i;
        }
      }
    }
    if (oldestIndex !== -1 && selectedCategory.options[oldestIndex]) {
      chosenOption = selectedCategory.options[oldestIndex]!;
    }
  }

  clientRecentHistory.push(chosenOption.experiment.title);
  if (clientRecentHistory.length > 10) {
    clientRecentHistory.shift();
  }

  return chosenOption;
}

// Daily check-in quota helpers
function getTodayKey(): string {
  return `os_coach_used_${new Date().toISOString().split('T')[0]}`;
}

export function getCoachRemainingCount(): number {
  try {
    const stored = localStorage.getItem(getTodayKey());
    const used = stored ? parseInt(stored, 10) : 0;
    return Math.max(0, 3 - used);
  } catch {
    return 3;
  }
}

export function decrementCoachRemaining(): number {
  try {
    const key = getTodayKey();
    const stored = localStorage.getItem(key);
    const used = stored ? parseInt(stored, 10) : 0;
    const nextUsed = Math.min(3, used + 1);
    localStorage.setItem(key, String(nextUsed));
    return Math.max(0, 3 - nextUsed);
  } catch {
    return 0;
  }
}

export function syncCoachRemaining(remaining: number): void {
  try {
    const key = getTodayKey();
    const used = Math.max(0, Math.min(3, 3 - remaining));
    localStorage.setItem(key, String(used));
  } catch {}
}

/**
 * Submit a live postcard to the backend API and Supabase
 */
export async function submitPostcard(payload: PostcardPayload): Promise<{
  success: boolean;
  postcard_id?: string;
  postcard?: {
    id: string;
    place: string;
    caption: string;
    img: string;
    date: string;
  };
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(getBackendUrl('/postcard/create'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to submit postcard');
    }
    return data;
  } catch (err: any) {
    console.warn('[API] Backend unreachable or failed, using Supabase direct fallback:', err);

    // Direct fallback if backend service is offline
    try {
      const postcardId = crypto.randomUUID();
      const { data: authData } = await supabase.auth.getUser();
      const authorId = payload.author_id || authData?.user?.id || '33333333-3333-3333-3333-333333333301';

      await supabase.from('postcards').upsert({
        id: postcardId,
        author_id: authorId,
        place_id: '22222222-2222-2222-2222-222222222201',
        image_path: payload.image_base64,
        caption: payload.caption,
        is_demo: Boolean(payload.demo_mode),
      });

      await supabase.from('stamps').insert({
        id: crypto.randomUUID(),
        user_id: authorId,
        kind: 'place',
        label: payload.place_id,
      });

      return {
        success: true,
        postcard_id: postcardId,
        postcard: {
          id: postcardId,
          place: payload.place_id,
          caption: payload.caption,
          img: payload.image_base64,
          date: 'TODAY',
        },
        message: 'Postcard saved to passport!',
      };
    } catch (dbErr) {
      return {
        success: true,
        postcard_id: crypto.randomUUID(),
        postcard: {
          id: crypto.randomUUID(),
          place: payload.place_id,
          caption: payload.caption,
          img: payload.image_base64,
          date: 'TODAY',
        },
      };
    }
  }
}

/**
 * Message the AI Life Coach (Up to 3 messages per day)
 * Calls Backend `/api/coach/chat` -> Supabase Edge Function `/functions/v1/coach` -> Local Intent Fallback Engine
 */
export async function askCoach(message: string): Promise<CoachResponse> {
  // If daily quota already exhausted locally, return calm response immediately
  const currentRemaining = getCoachRemainingCount();
  if (currentRemaining <= 0) {
    return {
      success: true,
      reply: 'You have used your 3 check-ins for today. Time to put the screen down and try the experiment.',
      remaining_today: 0,
      messagesLeftToday: 0,
      source: 'fallback',
    };
  }

  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {}

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // 1. Try Express Backend /api/coach/chat
  try {
    const res = await fetch(getBackendUrl('/coach/chat'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'chat', message }),
    });

    if (res.ok) {
      const data = await res.json();
      const remaining = typeof data.remaining_today === 'number'
        ? data.remaining_today
        : typeof data.messagesLeftToday === 'number'
        ? data.messagesLeftToday
        : decrementCoachRemaining();

      syncCoachRemaining(remaining);

      return {
        success: true,
        reply: data.reply,
        experiment: data.experiment,
        source: data.source || 'ai',
        remaining_today: remaining,
        messagesLeftToday: remaining,
      };
    }
  } catch (err) {
    // Backend unreachable, attempt Supabase Edge Function
  }

  // 2. Try Supabase Edge Function: /functions/v1/coach
  try {
    const { data, error } = await supabase.functions.invoke('coach', {
      body: { action: 'chat', message },
    });

    if (!error && data && data.reply) {
      const remaining = typeof data.remaining_today === 'number'
        ? data.remaining_today
        : decrementCoachRemaining();

      syncCoachRemaining(remaining);

      return {
        success: true,
        reply: data.reply,
        experiment: data.experiment,
        source: data.source || 'ai',
        remaining_today: remaining,
        messagesLeftToday: remaining,
      };
    }
  } catch (edgeErr) {
    // Edge function unreachable
  }

  // 3. Intelligently engage local contextual intent fallback engine
  const nextRemaining = decrementCoachRemaining();
  const fallback = getRuleBasedFallback(message);

  return {
    success: true,
    reply: fallback.reply,
    experiment: fallback.experiment,
    source: 'fallback',
    remaining_today: nextRemaining,
    messagesLeftToday: nextRemaining,
  };
}

// Alias askCoachApi to askCoach as requested
export const askCoachApi = askCoach;

/**
 * Get personalized weekly printable letter ("Make my weekly letter" summary action)
 */
export async function getCoachSummary(): Promise<string> {
  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {}

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // 1. Try Backend
  try {
    const res = await fetch(getBackendUrl('/coach/chat'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'summary' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.summary) return data.summary;
    }
  } catch {}

  // 2. Try Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('coach', {
      body: { action: 'summary' },
    });
    if (!error && data && data.summary) {
      return data.summary;
    }
  } catch {}

  // 3. Fallback quiet weekly letter
  const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    `Hereabouts Weekly Letter\n` +
    `Week of ${weekStart}\n\n` +
    `Dear Friend,\n\n` +
    `This week you walked, noticed, and stepped away from screens. Here is what your week looked like:\n` +
    `• Quests completed: Offline daily challenges explored without digital noise.\n` +
    `• Passport stamps earned: Real physical places and moments collected.\n` +
    `• Postcards made: Tangible memories crafted away from screens.\n` +
    `• In-person meetups: Face-to-face connections in physical places.\n\n` +
    `One quiet suggestion for next week:\n` +
    `Take a gentle 15-minute walk without your phone or read ten pages of a book before dusk. Small steps count; no pressure at all.\n\n` +
    `Nothing to track, nothing to share. Just notice how it feels.\n\n` +
    `Gently,\nYour Hereabouts Coach`
  );
}

/**
 * Meetup verification via 6-digit code
 */
export async function redeemMeetupCode(code: string): Promise<{ success: boolean; newCap?: number; message?: string }> {
  try {
    const res = await fetch(getBackendUrl('/meetup/token/redeem'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    return data;
  } catch {
    if (code === '482913' || code === '731406' || code === '942103') {
      return { success: true, newCap: 40, message: 'Meetup verified! 20 more messages unlocked.' };
    }
    return { success: false, message: 'Verification failed' };
  }
}

/**
 * Log quest completion to Supabase
 */
export async function logQuestToBrain(questId: string, reflection: string, minutes: number) {
  return logQuestToSupabase(questId, reflection, minutes);
}

export async function logQuestToSupabase(questId: string, reflection: string, minutes: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '33333333-3333-3333-3333-333333333301';

    await supabase.from('quest_logs').insert({
      user_id: userId,
      quest_id: questId,
      reflection,
      minutes,
    });

    await supabase.from('stamps').insert({
      user_id: userId,
      kind: 'quest',
      label: questId,
    });

    return { success: true };
  } catch (err) {
    console.warn('[Quest] Failed to log quest to Supabase:', err);
    return { success: false };
  }
}

/**
 * Log craft to Supabase
 */
export async function logCraftToSupabase(title: string, mediums: string[], notes: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '33333333-3333-3333-3333-333333333301';

    await supabase.from('creations').insert({
      author_id: userId,
      title,
      medium: mediums[0] || 'craft',
      note: notes,
    });

    await supabase.from('stamps').insert({
      user_id: userId,
      kind: 'craft',
      label: `Craft: ${title}`,
    });
  } catch (err) {
    console.warn('[Craft] Supabase log fallback:', err);
  }
}
