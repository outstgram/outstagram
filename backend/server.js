"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// backend/src/server.source.ts
var import_express5 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));

// backend/src/config.ts
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  allowDemoMode: (process.env.ALLOW_DEMO_MODE || "false").toLowerCase() === "true",
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    anonKey: process.env.SUPABASE_ANON_KEY || ""
  },
  ai: {
    activeProvider: (process.env.COPILOT_AI_PROVIDER || "groq").toLowerCase(),
    groq: {
      apiKey: process.env.GROQ_API_KEY || "",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free"
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      model: process.env.COACH_MODEL || "claude-3-haiku-20240307"
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      model: process.env.OLLAMA_CHAT_MODEL || "llama3.1:8b"
    }
  }
};

// backend/src/routes/postcard.routes.ts
var import_express = require("express");
var import_supabase_js = require("@supabase/supabase-js");

// backend/src/utils/validator.ts
var import_zod = require("zod");
var CreatePostcardSchema = import_zod.z.object({
  place_id: import_zod.z.string().min(1, "Place ID or location name is required"),
  caption: import_zod.z.string().trim().min(8, "Caption must be at least 8 characters").max(140, "Caption cannot exceed 140 characters"),
  lat: import_zod.z.number().min(-90).max(90),
  lng: import_zod.z.number().min(-180).max(180),
  accuracy_m: import_zod.z.number().min(0).max(5e3).optional().default(20),
  image_base64: import_zod.z.string().min(10, "Valid base64 image required"),
  demo_mode: import_zod.z.boolean().optional().default(false)
});
var CreateMeetupTokenSchema = import_zod.z.object({
  chat_id: import_zod.z.string().uuid()
});
var RedeemMeetupTokenSchema = import_zod.z.object({
  code: import_zod.z.string().trim().length(6, "Meetup code must be exactly 6 digits").regex(/^\d{6}$/, "Meetup code must contain only numbers")
});
var CoachMessageSchema = import_zod.z.object({
  action: import_zod.z.enum(["chat", "summary"]),
  message: import_zod.z.string().trim().min(1, "Message cannot be empty").max(500, "Message cannot exceed 500 characters").optional()
});
var QuestLogSchema = import_zod.z.object({
  quest_id: import_zod.z.string().uuid(),
  reflection: import_zod.z.string().trim().min(8, "Reflection must be at least 8 characters").max(140, "Reflection cannot exceed 140 characters"),
  minutes: import_zod.z.number().int().min(1, "Minutes must be at least 1").max(240, "Minutes cannot exceed 240")
});

// backend/src/utils/geo.ts
var EARTH_RADIUS_METERS = 6371e3;
function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}
function calculateDistanceMeters(point1, point2) {
  const dLat = degreesToRadians(point2.lat - point1.lat);
  const dLng = degreesToRadians(point2.lng - point1.lng);
  const lat1Rad = degreesToRadians(point1.lat);
  const lat2Rad = degreesToRadians(point2.lat);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}
function isValidCoordinates(coords) {
  if (typeof coords.lat !== "number" || typeof coords.lng !== "number") return false;
  if (isNaN(coords.lat) || isNaN(coords.lng)) return false;
  return coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180;
}
function isUserAtPlace(userCoords, placeCoords, placeRadiusMeters, accuracyMeters = 20) {
  const distanceMeters = calculateDistanceMeters(userCoords, placeCoords);
  const allowedRadiusMeters = placeRadiusMeters + Math.min(Math.max(accuracyMeters, 0), 50);
  return {
    atPlace: distanceMeters <= allowedRadiusMeters,
    distanceMeters: Math.round(distanceMeters),
    allowedRadiusMeters
  };
}

// backend/src/utils/image.ts
var MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024;
function isValidJpeg(buffer) {
  if (buffer.length < 4) return false;
  return buffer[0] === 255 && buffer[1] === 216;
}
function stripExifFromJpeg(buffer) {
  if (!isValidJpeg(buffer)) {
    return buffer;
  }
  const chunks = [Buffer.from([255, 216])];
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 255) {
      chunks.push(buffer.subarray(offset));
      break;
    }
    const marker = buffer[offset + 1];
    if (marker === 218) {
      chunks.push(buffer.subarray(offset));
      break;
    }
    if (marker === 217 || marker === 0) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    const segmentEnd = offset + 2 + length;
    if (marker === 225) {
      offset = segmentEnd;
      continue;
    }
    chunks.push(buffer.subarray(offset, segmentEnd));
    offset = segmentEnd;
  }
  return Buffer.concat(chunks);
}
function decodeAndValidateBase64Image(base64Str) {
  try {
    const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    if (buffer.length === 0) {
      return { valid: false, error: "image_empty" };
    }
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return { valid: false, error: "image_too_large" };
    }
    if (!isValidJpeg(buffer)) {
      return { valid: false, error: "image_not_jpeg" };
    }
    const sanitized = stripExifFromJpeg(buffer);
    return { valid: true, buffer: sanitized };
  } catch (err) {
    return { valid: false, error: "image_decode_failed" };
  }
}

// backend/src/services/postcard.service.ts
var PostcardService = class {
  /**
   * Validates all constraints before creating a postcard.
   */
  static validatePostcardCreation(payload, targetPlace, alreadyPostedToday, allowDemoMode) {
    const captionTrimmed = payload.caption ? payload.caption.trim() : "";
    if (captionTrimmed.length < 8 || captionTrimmed.length > 140) {
      return {
        valid: false,
        error: "caption_invalid",
        message: "Caption must be between 8 and 140 characters."
      };
    }
    if (alreadyPostedToday) {
      return {
        valid: false,
        error: "already_posted_today",
        message: "Only one postcard per day is allowed."
      };
    }
    const userCoords = { lat: payload.lat, lng: payload.lng };
    if (!isValidCoordinates(userCoords)) {
      return {
        valid: false,
        error: "invalid_coordinates",
        message: "User coordinates are outside valid geographic range."
      };
    }
    const isDemo = Boolean(payload.demo_mode && allowDemoMode);
    let distance = 0;
    if (!isDemo) {
      const placeCoords = { lat: targetPlace.lat, lng: targetPlace.lng };
      const proximity = isUserAtPlace(
        userCoords,
        placeCoords,
        targetPlace.radius_m,
        payload.accuracy_m ?? 20
      );
      distance = proximity.distanceMeters;
      if (!proximity.atPlace) {
        return {
          valid: false,
          error: "not_at_place",
          distanceMeters: distance,
          message: `You are ${distance}m away from ${targetPlace.name}. Must be within ${targetPlace.radius_m}m.`
        };
      }
    }
    const imgResult = decodeAndValidateBase64Image(payload.image_base64);
    if (!imgResult.valid || !imgResult.buffer) {
      return {
        valid: false,
        error: imgResult.error || "image_invalid",
        message: "Image must be a valid JPEG under 1.5MB."
      };
    }
    return {
      valid: true,
      sanitizedImageBuffer: imgResult.buffer,
      distanceMeters: distance
    };
  }
};

// backend/src/routes/postcard.routes.ts
var postcardRouter = (0, import_express.Router)();
var supabase = config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey) ? (0, import_supabase_js.createClient)(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey) : null;
var DEMO_PLACES = {
  "22222222-2222-2222-2222-222222222201": {
    id: "22222222-2222-2222-2222-222222222201",
    name: "Riverside Artisan Cafe",
    lat: 12.9716,
    lng: 77.5946,
    radius_m: 120
  },
  "riverside-cafe": {
    id: "22222222-2222-2222-2222-222222222201",
    name: "Riverside Cafe",
    lat: 12.9716,
    lng: 77.5946,
    radius_m: 120
  },
  "22222222-2222-2222-2222-222222222204": {
    id: "22222222-2222-2222-2222-222222222204",
    name: "Demo Spot (Venue simulated)",
    lat: 0,
    lng: 0,
    radius_m: 500
  }
};
postcardRouter.get("/feed", async (_req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("postcards").select("id, caption, image_path, taken_at, place_id, author_id").order("taken_at", { ascending: false }).limit(20);
      if (!error && data && data.length > 0) {
        return res.status(200).json({ success: true, postcards: data });
      }
    }
    return res.status(200).json({ success: true, postcards: [] });
  } catch (err) {
    return res.status(500).json({ error: "server_error", message: err.message });
  }
});
postcardRouter.post("/create", async (req, res) => {
  try {
    const parseResult = CreatePostcardSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "validation_error",
        details: parseResult.error.flatten()
      });
    }
    const payload = parseResult.data;
    const authorId = req.headers["x-user-id"] || "33333333-3333-3333-3333-333333333301";
    let place = DEMO_PLACES[payload.place_id] || DEMO_PLACES[payload.place_id.toLowerCase().replace(/[^a-z0-9]+/g, "-")];
    let realPlaceId = place?.id || "22222222-2222-2222-2222-222222222201";
    if (!place && supabase) {
      const { data } = await supabase.from("places").select("*").eq("id", payload.place_id).maybeSingle();
      if (data) {
        place = data;
        realPlaceId = data.id;
      }
    }
    if (!place) {
      place = {
        id: realPlaceId,
        name: payload.place_id,
        lat: payload.lat,
        lng: payload.lng,
        radius_m: 150
      };
    }
    const validation = PostcardService.validatePostcardCreation(
      payload,
      place,
      false,
      // alreadyPostedToday
      config.allowDemoMode
    );
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        message: validation.message,
        distance_m: validation.distanceMeters
      });
    }
    const postcardId = crypto.randomUUID();
    let imagePublicUrl = payload.image_base64;
    if (supabase && validation.sanitizedImageBuffer) {
      try {
        const filePath = `${authorId}/${postcardId}.jpg`;
        const { error: uploadErr } = await supabase.storage.from("postcards").upload(filePath, validation.sanitizedImageBuffer, {
          contentType: "image/jpeg",
          upsert: true
        });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("postcards").getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            imagePublicUrl = urlData.publicUrl;
          }
        }
        await supabase.from("postcards").insert({
          id: postcardId,
          author_id: authorId,
          place_id: realPlaceId,
          image_path: imagePublicUrl,
          caption: payload.caption.trim(),
          is_demo: Boolean(payload.demo_mode && config.allowDemoMode)
        });
        await supabase.from("stamps").insert({
          user_id: authorId,
          kind: "place",
          label: place.name
        });
      } catch (dbErr) {
        console.warn("[Postcard] Supabase write fallback:", dbErr);
      }
    }
    return res.status(200).json({
      success: true,
      postcard_id: postcardId,
      postcard: {
        id: postcardId,
        place: place.name,
        caption: payload.caption.trim(),
        img: imagePublicUrl,
        date: "TODAY"
      },
      message: "Postcard validated and published! Place stamp earned."
    });
  } catch (err) {
    return res.status(500).json({ error: "server_error", message: err.message });
  }
});

// backend/src/routes/meetup.routes.ts
var import_express2 = require("express");

// backend/src/utils/crypto.ts
var import_crypto = __toESM(require("crypto"));
function generateSixDigitCode() {
  const min = 1e5;
  const max = 999999;
  return import_crypto.default.randomInt(min, max + 1).toString();
}
function hashToken(code, salt) {
  return import_crypto.default.createHash("sha256").update(code.trim() + salt.trim()).digest("hex");
}
function timingSafeEqualString(a, b) {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return import_crypto.default.timingSafeEqual(bufA, bufB);
}

// backend/src/services/meetup.service.ts
var MeetupService = class {
  /**
   * Prepares and validates a new meetup token for a locked chat.
   */
  static createToken(chat, userId, tokensCreatedInLastHour) {
    if (chat.user_a !== userId && chat.user_b !== userId) {
      return {
        valid: false,
        error: "not_member",
        message: "You are not a member of this chat."
      };
    }
    if (chat.message_count < chat.message_cap) {
      return {
        valid: false,
        error: "not_locked",
        message: `Chat is not locked yet (${chat.message_count}/${chat.message_cap}).`
      };
    }
    if (tokensCreatedInLastHour >= 5) {
      return {
        valid: false,
        error: "rate_limited",
        message: "Rate limit reached: at most 5 codes per hour."
      };
    }
    const code = generateSixDigitCode();
    const tokenHash = hashToken(code, chat.id);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1e3).toISOString();
    return {
      valid: true,
      code,
      tokenHash,
      expiresAt
    };
  }
  /**
   * Validates redemption of a meetup code by the recipient.
   */
  static validateRedemption(token, chat, redeemerUserId, inputCode) {
    if (chat.user_a !== redeemerUserId && chat.user_b !== redeemerUserId) {
      return {
        valid: false,
        error: "not_member",
        message: "You are not a participant in this conversation."
      };
    }
    if (token.created_by === redeemerUserId) {
      return {
        valid: false,
        error: "self_redeem",
        message: "You cannot redeem your own meetup code. Your friend must enter it."
      };
    }
    if (token.attempts >= 5) {
      return {
        valid: false,
        error: "too_many_attempts",
        message: "Too many failed attempts. This code is locked."
      };
    }
    if (token.used_at) {
      return {
        valid: false,
        error: "already_used",
        message: "This code has already been redeemed."
      };
    }
    if (new Date(token.expires_at).getTime() < Date.now()) {
      return {
        valid: false,
        error: "expired",
        message: "This code has expired (5-minute limit)."
      };
    }
    const candidateHash = hashToken(inputCode, chat.id);
    if (!timingSafeEqualString(token.token_hash, candidateHash)) {
      return {
        valid: false,
        error: "invalid_code",
        message: "The code you entered does not match."
      };
    }
    const newCap = (chat.message_cap || 20) + 20;
    return {
      valid: true,
      newCap
    };
  }
};

// backend/src/routes/meetup.routes.ts
var meetupRouter = (0, import_express2.Router)();
var mockChats = {
  "chat-123": {
    id: "chat-123",
    user_a: "user-alice",
    user_b: "user-bob",
    message_count: 20,
    message_cap: 20,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
};
var mockTokens = {};
meetupRouter.post("/token/create", (req, res) => {
  const parseResult = CreateMeetupTokenSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "validation_error", details: parseResult.error.flatten() });
  }
  const { chat_id } = parseResult.data;
  const chat = mockChats[chat_id];
  if (!chat) {
    return res.status(404).json({ error: "chat_not_found" });
  }
  const callerId = req.headers["x-user-id"] || chat.user_a;
  const result = MeetupService.createToken(chat, callerId, 0);
  if (!result.valid) {
    return res.status(400).json({ error: result.error, message: result.message });
  }
  const tokenId = crypto.randomUUID();
  mockTokens[result.code] = {
    id: tokenId,
    chat_id: chat.id,
    created_by: callerId,
    token_hash: result.tokenHash,
    attempts: 0,
    expires_at: result.expiresAt
  };
  return res.status(200).json({
    success: true,
    code: result.code,
    expires_at: result.expiresAt
  });
});
meetupRouter.post("/token/redeem", (req, res) => {
  const parseResult = RedeemMeetupTokenSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "validation_error", details: parseResult.error.flatten() });
  }
  const { code } = parseResult.data;
  const token = mockTokens[code];
  if (!token) {
    return res.status(400).json({ error: "invalid_code", message: "Token not found or invalid" });
  }
  const chat = mockChats[token.chat_id];
  if (!chat) {
    return res.status(404).json({ error: "chat_not_found" });
  }
  const redeemerId = req.headers["x-user-id"] || chat.user_b;
  const validation = MeetupService.validateRedemption(token, chat, redeemerId, code);
  if (!validation.valid) {
    token.attempts += 1;
    return res.status(400).json({ error: validation.error, message: validation.message });
  }
  token.used_at = (/* @__PURE__ */ new Date()).toISOString();
  token.used_by = redeemerId;
  chat.message_cap = validation.newCap;
  return res.status(200).json({
    success: true,
    chat_id: chat.id,
    new_cap: validation.newCap,
    message: "Meetup verified! 20 more messages unlocked and stamps awarded."
  });
});

// backend/src/routes/coach.routes.ts
var import_express3 = require("express");
var import_supabase_js2 = require("@supabase/supabase-js");

// backend/src/ai/groq-provider.ts
var GroqProvider = class {
  providerId = "groq";
  name = "Groq Cloud (Llama 3.3)";
  apiKey;
  model;
  constructor() {
    this.apiKey = config.ai.groq.apiKey;
    this.model = config.ai.groq.model;
  }
  async checkHealth() {
    if (!this.apiKey) {
      return { online: false, message: "GROQ_API_KEY is not set", activeModel: this.model };
    }
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return {
        online: res.ok,
        message: res.ok ? "Groq API is ready" : `Groq returned ${res.status}`,
        activeModel: this.model
      };
    } catch (err) {
      return { online: false, message: err.message, activeModel: this.model };
    }
  }
  async generateCompletion(options) {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is required");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 8e3);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userMessage }
          ],
          max_tokens: 300,
          temperature: 0.6
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errorText}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Groq returned empty response");
      }
      return content.trim();
    } finally {
      clearTimeout(timer);
    }
  }
};

// backend/src/ai/gemini-provider.ts
var GeminiProvider = class {
  providerId = "gemini";
  name = "Google Gemini (Flash)";
  apiKey;
  model;
  constructor() {
    this.apiKey = config.ai.gemini.apiKey;
    this.model = config.ai.gemini.model;
  }
  async checkHealth() {
    if (!this.apiKey) {
      return { online: false, message: "GEMINI_API_KEY is not set", activeModel: this.model };
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}?key=${this.apiKey}`
      );
      return {
        online: res.ok,
        message: res.ok ? "Gemini API is ready" : `Gemini returned ${res.status}`,
        activeModel: this.model
      };
    } catch (err) {
      return { online: false, message: err.message, activeModel: this.model };
    }
  }
  async generateCompletion(options) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 8e3);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: options.systemPrompt }] },
          contents: [{ parts: [{ text: options.userMessage }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.6 }
        }),
        signal: controller.signal
      });
      if (!res.ok && res.status === 404 && this.model !== "gemini-1.5-flash") {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        res = await fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: options.systemPrompt }] },
            contents: [{ parts: [{ text: options.userMessage }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.6 }
          }),
          signal: controller.signal
        });
      }
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorText}`);
      }
      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Gemini returned empty response");
      }
      return content.trim();
    } finally {
      clearTimeout(timer);
    }
  }
};

// backend/src/ai/openrouter-provider.ts
var OpenRouterProvider = class {
  providerId = "openrouter";
  name = "OpenRouter";
  apiKey;
  model;
  constructor() {
    this.apiKey = config.ai.openrouter.apiKey;
    this.model = config.ai.openrouter.model;
  }
  async checkHealth() {
    if (!this.apiKey) {
      return { online: false, message: "OPENROUTER_API_KEY is not set", activeModel: this.model };
    }
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return {
        online: res.ok,
        message: res.ok ? "OpenRouter API is ready" : `OpenRouter returned ${res.status}`,
        activeModel: this.model
      };
    } catch (err) {
      return { online: false, message: err.message, activeModel: this.model };
    }
  }
  async generateCompletion(options) {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 8e3);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userMessage }
          ],
          max_tokens: 300
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter API error (${res.status}): ${errorText}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenRouter returned empty response");
      }
      return content.trim();
    } finally {
      clearTimeout(timer);
    }
  }
};

// backend/src/ai/anthropic-provider.ts
var AnthropicProvider = class {
  providerId = "anthropic";
  name = "Anthropic Claude";
  apiKey;
  model;
  constructor() {
    this.apiKey = config.ai.anthropic.apiKey;
    this.model = config.ai.anthropic.model;
  }
  async checkHealth() {
    if (!this.apiKey) {
      return { online: false, message: "ANTHROPIC_API_KEY is not set", activeModel: this.model };
    }
    return { online: true, message: "Anthropic Claude is configured", activeModel: this.model };
  }
  async generateCompletion(options) {
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 8e3);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 300,
          system: options.systemPrompt,
          messages: [{ role: "user", content: options.userMessage }]
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
      }
      const data = await res.json();
      const content = data.content?.[0]?.text;
      if (!content) {
        throw new Error("Anthropic returned empty response");
      }
      return content.trim();
    } finally {
      clearTimeout(timer);
    }
  }
};

// backend/src/ai/circuit-breaker.ts
var CircuitBreaker = class {
  name;
  threshold;
  cooldownMs;
  state = "closed";
  failureCount = 0;
  lastFailureTime = 0;
  constructor(name, threshold = 3, cooldownMs = 6e4) {
    this.name = name;
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }
  canAttempt() {
    const now = Date.now();
    if (this.state === "open") {
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.state = "half_open";
        return true;
      }
      return false;
    }
    return true;
  }
  recordSuccess() {
    this.failureCount = 0;
    this.state = "closed";
  }
  recordFailure(reason) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "open";
      console.warn(
        `[CircuitBreaker] Provider ${this.name} circuit OPEN for ${this.cooldownMs / 1e3}s. Reason: ${reason || "error"}`
      );
    }
  }
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
};

// backend/src/ai/provider-factory.ts
var breakers = {
  anthropic: new CircuitBreaker("anthropic", 3, 6e4),
  groq: new CircuitBreaker("groq", 3, 6e4),
  gemini: new CircuitBreaker("gemini", 3, 6e4),
  openrouter: new CircuitBreaker("openrouter", 3, 6e4)
};
async function executeWithFallback(options) {
  const activeName = (config.ai.activeProvider || "").toLowerCase();
  const allProviders = [
    {
      name: "gemini",
      getProvider: () => new GeminiProvider(),
      hasKey: Boolean(config.ai.gemini.apiKey)
    },
    {
      name: "anthropic",
      getProvider: () => new AnthropicProvider(),
      hasKey: Boolean(config.ai.anthropic.apiKey)
    },
    {
      name: "groq",
      getProvider: () => new GroqProvider(),
      hasKey: Boolean(config.ai.groq.apiKey)
    },
    {
      name: "openrouter",
      getProvider: () => new OpenRouterProvider(),
      hasKey: Boolean(config.ai.openrouter.apiKey)
    }
  ];
  const prioritized = [...allProviders].sort((a, b) => {
    if (a.name === activeName && a.hasKey) return -1;
    if (b.name === activeName && b.hasKey) return 1;
    return 0;
  });
  let lastError = null;
  for (const { name, getProvider, hasKey } of prioritized) {
    const breaker = breakers[name];
    if (!hasKey || !breaker.canAttempt()) {
      continue;
    }
    try {
      const provider = getProvider();
      const reply = await provider.generateCompletion({
        ...options,
        timeoutMs: options.timeoutMs || 8e3
      });
      if (reply && reply.trim()) {
        breaker.recordSuccess();
        return { reply: reply.trim(), provider: name };
      }
      breaker.recordFailure("Empty reply returned");
    } catch (err) {
      breaker.recordFailure(err.message);
      lastError = err;
      console.warn(`[ProviderFallback] Provider ${name} failed:`, err.message);
    }
  }
  throw lastError || new Error("No AI provider available or all circuits open.");
}

// backend/src/ai/coach-prompt.ts
function buildCoachSystemPrompt(context) {
  let prompt = `You are the Hereabouts Life Coach, a calm, kind guide. Rules:
- Reply in 3 sentences or fewer.
- Propose ONE small offline experiment lasting up to 7 days.
- Never recommend content to consume (no videos, accounts, apps, shows, feeds).
- Never shame the user. If they missed days, make the goal smaller.
- Do not ask more than one question.
- If the user seems in distress, be gentle and suggest talking to someone they trust.
- Stay private: never suggest posting or sharing the experiment.
- The goal is to make the coach less needed over time (end replies by encouraging the user to do the experiment without the app); never send or suggest engagement-style reminders.
- You have no access to phone screen time data. State this plainly if asked.

Context: In the last 7 days, the user completed ${context.daysDoneLast7} quests, earned ${context.stampsLast7} stamps, logged ${context.meetupsLast7} meetups, and made ${context.creationsLast7 ?? 0} creations.`;
  if (context.daysDoneLast7 <= 3) {
    prompt += ` The user completed few days. Make the experiment smaller than usual and never scold.`;
  }
  return prompt;
}
var INTENT_CATEGORIES = [
  {
    id: "learn",
    keywords: ["learn", "study", "skills", "skill", "knowledge", "course", "education", "learning", "reading up", "topic", "understand"],
    options: [
      {
        reply: "Pick one physical skill or topic you can explore without a browser. Give twenty minutes to a book or a notebook today.",
        experiment: {
          title: "20m screen-free study",
          days: 3,
          why: "Screen-free exploration deepens focus without digital rabbit holes."
        }
      },
      {
        reply: "Choose one topic you have wanted to understand. Spend twenty minutes taking handwritten notes from a book or your own memory.",
        experiment: {
          title: "20m handwritten inquiry",
          days: 2,
          why: "Handwritten thinking clarifies complex ideas without endless tab-switching."
        }
      }
    ]
  },
  {
    id: "distraction",
    keywords: ["distraction", "distractions", "distracted", "phone", "scroll", "scrolling", "social media", "doomscroll", "screen", "notification", "notifications", "app", "apps", "digital", "screen time", "feed"],
    options: [
      {
        reply: "Place your phone in a drawer across the room for the next two hours. Notice the quiet space that opens up.",
        experiment: {
          title: "Phone in another room for 2h",
          days: 1,
          why: "Physical distance removes the unconscious reach for the screen."
        }
      },
      {
        reply: "Turn off all non-human notifications for the rest of today. Keep your phone facing down on a bookshelf.",
        experiment: {
          title: "Bookshelf phone silence",
          days: 1,
          why: "Eliminating background pings restores continuous thought."
        }
      }
    ]
  },
  {
    id: "read",
    keywords: ["read", "reading", "book", "books", "novel", "pages", "paperback", "chapter", "author"],
    options: [
      {
        reply: "Read ten pages of a printed book by a window before turning on any lamps tonight.",
        experiment: {
          title: "10 pages before dusk",
          days: 7,
          why: "Ten printed pages build an unhurried evening rhythm."
        }
      },
      {
        reply: "Spend fifteen minutes reading a physical book with a warm drink, leaving your phone in another room.",
        experiment: {
          title: "15m quiet reading with tea",
          days: 5,
          why: "Reading on paper allows your nervous system to settle."
        }
      }
    ]
  },
  {
    id: "lonely",
    keywords: ["lonely", "alone", "isolated", "isolation", "solitude", "empty", "disconnected", "unconnected", "nobody"],
    options: [
      {
        reply: "Take a gentle fifteen-minute walk through your neighborhood. Make eye contact and nod at one person.",
        experiment: {
          title: "Neighborhood hello walk",
          days: 1,
          why: "A brief human acknowledgment grounds you in the community."
        }
      },
      {
        reply: "Sit in a quiet local cafe or on a public park bench for twenty minutes without headphones. Just watch the world pass by.",
        experiment: {
          title: "20m quiet presence among people",
          days: 1,
          why: "Sharing physical space softens feelings of separation."
        }
      }
    ]
  },
  {
    id: "friend",
    keywords: ["friend", "friends", "connect", "connection", "meet", "meeting", "reconnect", "catch up", "talk", "call", "someone", "companion", "neighbor"],
    options: [
      {
        reply: "Send one handwritten postcard or a five-word message to someone you miss. Invite them for tea.",
        experiment: {
          title: "Invite one friend offline",
          days: 3,
          why: "Real connection starts with simple, unhurried overtures."
        }
      },
      {
        reply: "Plan a brief face-to-face meet with a nearby friend or neighbor this week. Keep it simple\u2014just a walk around the block.",
        experiment: {
          title: "15m neighborhood stroll with a friend",
          days: 3,
          why: "Side-by-side walking sparks unforced conversation."
        }
      }
    ]
  },
  {
    id: "nature",
    keywords: ["nature", "outside", "walk", "walking", "fresh air", "trees", "tree", "park", "outdoor", "outdoors", "stroll", "sunshine", "sunlight", "sky", "greenery", "neighborhood", "garden", "forest"],
    options: [
      {
        reply: "Step outside without headphones for 15 minutes. Find three distinct natural sounds.",
        experiment: {
          title: "15-minute sound walk",
          days: 1,
          why: "Listening to the wind, birds, and leaves reorients the senses."
        }
      },
      {
        reply: "Step outside and touch the rough bark of a tree or the stone of an old wall. Take five deep breaths of fresh air.",
        experiment: {
          title: "5-minute sensory tree pause",
          days: 1,
          why: "Physical contact with natural elements grounds wandering thoughts."
        }
      }
    ]
  },
  {
    id: "anxious",
    keywords: ["anxious", "anxiety", "stress", "stressed", "overwhelmed", "worry", "worried", "panic", "nervous", "racing", "tension", "breathe", "breath", "calm"],
    options: [
      {
        reply: "Sit quietly for five minutes with your feet flat on the floor. Take five slow breaths with your eyes closed.",
        experiment: {
          title: "5-minute grounding pause",
          days: 1,
          why: "Physical stillness gently calms an overstimulated nervous system."
        }
      },
      {
        reply: "Place both hands on a cup of warm water or tea. Feel the warmth through your palms and breathe gently for three minutes.",
        experiment: {
          title: "3-minute warm cup grounding",
          days: 1,
          why: "Sensory touch interrupts racing thoughts."
        }
      }
    ]
  },
  {
    id: "bored",
    keywords: ["bored", "boredom", "restless", "nothing to do", "stuck", "uninspired", "aimless", "fidgety", "idle"],
    options: [
      {
        reply: "Find a piece of paper and sketch the view from your nearest window, even roughly.",
        experiment: {
          title: "Window sketch",
          days: 1,
          why: "Translating what you see onto paper turns restlessness into observation."
        }
      },
      {
        reply: "Take a notebook and list 10 curious details you can see in the room right now that you never noticed before.",
        experiment: {
          title: "10 unnoticed room details",
          days: 1,
          why: "Noticing the familiar with fresh eyes unlocks curiosity."
        }
      }
    ]
  },
  {
    id: "make",
    keywords: ["make", "making", "craft", "crafting", "create", "creating", "creative", "hands", "handmade", "drawing", "draw", "sketch", "art", "wood", "clay", "origami", "bake", "baking", "cook", "build"],
    options: [
      {
        reply: "Make something tangible with your hands today using materials you already have at home.",
        experiment: {
          title: "Small handmade object",
          days: 2,
          why: "Working with physical materials grounds the mind in tactile reality."
        }
      },
      {
        reply: "Fold a sheet of paper into an origami crane or write a three-line poem on the back of an old receipt.",
        experiment: {
          title: "Paper craft or tiny poem",
          days: 1,
          why: "Small creative acts spark joy without digital screens."
        }
      }
    ]
  }
];
var DEFAULT_CATEGORY = {
  id: "default",
  keywords: [],
  options: [
    {
      reply: "Step away from your screen for a gentle breath of fresh air. Notice the light and the temperature right outside your door.",
      experiment: { title: "Threshold pause", days: 1, why: "Crossing the doorway resets your mental state." }
    },
    {
      reply: "Pick one tactile object near you\u2014a stone, a wooden spoon, or a pen. Hold it and inspect how it was made.",
      experiment: { title: "Tactile curiosity pause", days: 1, why: "Physical textures ground you firmly in the present moment." }
    },
    {
      reply: "Brew a cup of tea or pour a glass of cold water with your full attention. Drink it without checking anything.",
      experiment: { title: "Unplugged drink ritual", days: 1, why: "Single-tasking a simple routine invites quiet clarity." }
    },
    {
      reply: "Take three slow, deep breaths with your eyes turned away from all screens. Give yourself permission to pause.",
      experiment: { title: "Three conscious breaths", days: 1, why: "A deliberate pause reminds your body that it is safe to slow down." }
    }
  ]
};
var FALLBACK_RULES = {
  learn: INTENT_CATEGORIES.find((c) => c.id === "learn").options[0],
  distraction: INTENT_CATEGORIES.find((c) => c.id === "distraction").options[0],
  scroll: INTENT_CATEGORIES.find((c) => c.id === "distraction").options[0],
  read: INTENT_CATEGORIES.find((c) => c.id === "read").options[0],
  lonely: INTENT_CATEGORIES.find((c) => c.id === "lonely").options[0],
  friend: INTENT_CATEGORIES.find((c) => c.id === "friend").options[0],
  nature: INTENT_CATEGORIES.find((c) => c.id === "nature").options[0],
  anxious: INTENT_CATEGORIES.find((c) => c.id === "anxious").options[0],
  bored: INTENT_CATEGORIES.find((c) => c.id === "bored").options[0],
  make: INTENT_CATEGORIES.find((c) => c.id === "make").options[0],
  default: DEFAULT_CATEGORY.options[0]
};
var recentHistory = [];
function getRuleBasedFallback(message) {
  const normalized = (message || "").toLowerCase();
  let bestCategory = null;
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
  let chosenOption = selectedCategory.options[0];
  for (const opt of selectedCategory.options) {
    if (!recentHistory.includes(opt.experiment.title)) {
      chosenOption = opt;
      break;
    }
  }
  if (recentHistory.includes(chosenOption.experiment.title) && selectedCategory.options.length > 1) {
    let oldestIndex = -1;
    let minHistoryPos = Infinity;
    for (let i = 0; i < selectedCategory.options.length; i++) {
      const pos = recentHistory.indexOf(selectedCategory.options[i].experiment.title);
      if (pos < minHistoryPos) {
        minHistoryPos = pos;
        oldestIndex = i;
      }
    }
    if (oldestIndex !== -1) {
      chosenOption = selectedCategory.options[oldestIndex];
    }
  }
  recentHistory.push(chosenOption.experiment.title);
  if (recentHistory.length > 10) {
    recentHistory.shift();
  }
  return chosenOption;
}
function extractExperimentFromText(text) {
  let days = 1;
  const numMatch = text.match(/(\d+)\s+days?/i);
  if (numMatch && numMatch[1]) {
    days = Math.min(7, Math.max(1, parseInt(numMatch[1], 10)));
  }
  const sentences = text.split(/(?<=[.!?])\s+/);
  let title = "Small offline experiment";
  for (const s of sentences) {
    if (/experiment|try|leave|put|walk|read|reach|step|sit|sketch|make|fold|pick/i.test(s)) {
      title = s.replace(/^.*?(try|let's try|put|leave|read|take|reach|spend|sketch|make|fold|pick)/i, "$1").trim();
      if (title.length > 50) {
        title = title.slice(0, 47) + "\u2026";
      }
      break;
    }
  }
  return { title, days };
}

// backend/src/services/coach.service.ts
var CoachService = class {
  /**
   * Processes a user chat message to the AI coach.
   */
  static async processMessage(userMessage, userMessagesTodayCount, habitContext) {
    if (userMessagesTodayCount >= 3) {
      throw {
        statusCode: 429,
        error: "daily_limit_reached",
        message: "You have reached your 3 coach check-ins for today. Come back tomorrow."
      };
    }
    const systemPrompt = buildCoachSystemPrompt(habitContext);
    try {
      const { reply } = await executeWithFallback({
        systemPrompt,
        userMessage,
        timeoutMs: 8e3
      });
      const experiment = extractExperimentFromText(reply);
      return {
        reply,
        source: "ai",
        experiment,
        remaining_today: Math.max(0, 3 - userMessagesTodayCount - 1)
      };
    } catch (err) {
      console.warn("AI call failed or timed out. Engaging rule-based fallback:", err.message);
      const fallback = getRuleBasedFallback(userMessage);
      return {
        reply: fallback.reply,
        source: "fallback",
        experiment: fallback.experiment,
        remaining_today: Math.max(0, 3 - userMessagesTodayCount - 1)
      };
    }
  }
  /**
   * Generates a quiet weekly offline habit letter.
   * Covers what you did, what you made, who you met, and one suggestion for next week.
   */
  static generateWeeklySummary(userName, habitContext, weekStartDate) {
    const suggestion = habitContext.daysDoneLast7 <= 3 ? "Take a gentle 5-minute walk without your phone or read two pages of a book before sleep. Small steps count; no pressure at all." : "Choose one afternoon to leave your phone at home and explore a street you have not walked before.";
    return `Hereabouts Weekly Letter
Week of ${weekStartDate}

Dear ${userName},

This week you walked, noticed, and stepped away from screens. Here is what your week looked like:
\u2022 Quests completed: ${habitContext.daysDoneLast7} offline daily challenges.
\u2022 Passport stamps earned: ${habitContext.stampsLast7} real moments collected.
\u2022 Postcards made: ${habitContext.creationsLast7 ?? 0} physical moments documented.
\u2022 In-person meetups: ${habitContext.meetupsLast7} face-to-face connections.

One quiet suggestion for next week:
${suggestion}

Nothing to track, nothing to share. Just notice how it feels.

Gently,
Your Hereabouts Coach`;
  }
};

// backend/src/routes/coach.routes.ts
var coachRouter = (0, import_express3.Router)();
var supabase2 = config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey) ? (0, import_supabase_js2.createClient)(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey) : null;
var userDailyMessageCount = {};
coachRouter.post("/chat", async (req, res) => {
  try {
    const parseResult = CoachMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "validation_error", details: parseResult.error.flatten() });
    }
    const { action, message = "" } = parseResult.data;
    let userId = req.headers["x-user-id"] || "33333333-3333-3333-3333-333333333301";
    const authHeader = req.headers.authorization;
    if (authHeader && supabase2) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: { user } } = await supabase2.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch {
      }
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let daysDoneLast7 = 0;
    let stampsLast7 = 0;
    let meetupsLast7 = 0;
    let creationsLast7 = 0;
    let userMsgsToday = userDailyMessageCount[userId] || 0;
    if (supabase2) {
      try {
        const [questRes, stampsRes, meetupsRes, creationsRes, msgsRes] = await Promise.all([
          supabase2.from("quest_logs").select("id", { count: "exact" }).eq("user_id", userId).gte("created_at", sevenDaysAgo),
          supabase2.from("stamps").select("id", { count: "exact" }).eq("user_id", userId).gte("created_at", sevenDaysAgo),
          supabase2.from("meetups").select("id", { count: "exact" }).gte("met_at", sevenDaysAgo),
          supabase2.from("postcards").select("id", { count: "exact" }).eq("author_id", userId).gte("taken_at", sevenDaysAgo),
          supabase2.from("coach_messages").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user").gte("created_at", `${today}T00:00:00.000Z`)
        ]);
        daysDoneLast7 = questRes.count || 0;
        stampsLast7 = stampsRes.count || 0;
        meetupsLast7 = meetupsRes.count || 0;
        creationsLast7 = creationsRes.count || 0;
        if (typeof msgsRes.count === "number") {
          userMsgsToday = msgsRes.count;
        }
      } catch (err) {
        console.warn("[Coach] Supabase stats query fallback:", err);
      }
    }
    const habitContext = {
      daysDoneLast7,
      stampsLast7,
      meetupsLast7,
      creationsLast7
    };
    if (action === "summary") {
      const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
      const summaryText = CoachService.generateWeeklySummary("Friend", habitContext, weekStart);
      if (supabase2) {
        try {
          await supabase2.from("coach_summaries").upsert(
            {
              user_id: userId,
              week_start: weekStart,
              summary: summaryText
            },
            { onConflict: "user_id,week_start" }
          );
        } catch (err) {
          console.warn("[Coach] Supabase summary upsert error:", err);
        }
      }
      return res.status(200).json({
        success: true,
        summary: summaryText,
        stats: habitContext
      });
    }
    const trimmed = (message || "").trim();
    if (!trimmed || trimmed.length > 500) {
      return res.status(400).json({
        error: "invalid_message",
        message: "Message must be between 1 and 500 characters."
      });
    }
    if (userMsgsToday >= 3) {
      return res.status(429).json({
        error: "daily_limit_reached",
        message: "You have used your 3 coach check-ins for today. Come back tomorrow.",
        remaining_today: 0
      });
    }
    if (supabase2) {
      try {
        await supabase2.from("coach_messages").insert({
          user_id: userId,
          role: "user",
          content: trimmed,
          source: "ai"
        });
      } catch (e) {
        console.warn("[Coach] Persist user message error:", e);
      }
    }
    const response = await CoachService.processMessage(trimmed, userMsgsToday, habitContext);
    userDailyMessageCount[userId] = userMsgsToday + 1;
    if (supabase2) {
      try {
        await supabase2.from("coach_messages").insert({
          user_id: userId,
          role: "assistant",
          content: response.reply,
          source: response.source
        });
      } catch (e) {
        console.warn("[Coach] Persist assistant reply error:", e);
      }
    }
    return res.status(200).json({
      success: true,
      ...response
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.error || "server_error", message: err.message });
  }
});

// backend/src/routes/group.routes.ts
var import_express4 = require("express");

// backend/src/services/group.service.ts
var GroupService = class {
  /**
   * Host creates a 10-minute group code.
   */
  static createGroupCode(hostId) {
    const code = generateSixDigitCode();
    const tokenHash = hashToken(code, "group-salt");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
    return { code, tokenHash, expiresAt };
  }
  /**
   * Member joins group using code.
   */
  static joinGroup(group, userId, inputCode) {
    if (new Date(group.expires_at).getTime() < Date.now()) {
      return { success: false, error: "expired", message: "Group code expired." };
    }
    if (group.host_id === userId) {
      return { success: false, error: "host_self_join", message: "You are the host of this group." };
    }
    const candidateHash = hashToken(inputCode, "group-salt");
    if (group.code_hash !== candidateHash) {
      return { success: false, error: "invalid_code", message: "Invalid group code." };
    }
    const currentMembers = new Set(group.members);
    currentMembers.add(userId);
    const totalCount = 1 + currentMembers.size;
    return {
      success: true,
      totalMembers: totalCount,
      unlocked: totalCount >= 3,
      message: totalCount >= 3 ? "Group unlocked! 3+ members gathered in person." : `Joined group (${totalCount}/3 needed).`
    };
  }
};

// backend/src/routes/group.routes.ts
var groupRouter = (0, import_express4.Router)();
var mockGroups = {};
groupRouter.post("/create", (req, res) => {
  const hostId = req.headers["x-user-id"] || "host-1";
  const group = GroupService.createGroupCode(hostId);
  const groupId = crypto.randomUUID();
  mockGroups[group.code] = {
    id: groupId,
    host_id: hostId,
    code_hash: group.tokenHash,
    expires_at: group.expiresAt,
    members: []
  };
  return res.status(200).json({
    success: true,
    group_id: groupId,
    code: group.code,
    expires_at: group.expiresAt
  });
});
groupRouter.post("/join", (req, res) => {
  const userId = req.headers["x-user-id"] || "guest-1";
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "invalid_code", message: "Group code required" });
  }
  const group = mockGroups[code];
  if (!group) {
    return res.status(404).json({ error: "not_found", message: "Group code not found" });
  }
  const result = GroupService.joinGroup(group, userId, code);
  if (!result.success) {
    return res.status(400).json({ error: result.error, message: result.message });
  }
  group.members.push(userId);
  return res.status(200).json(result);
});

// backend/src/server.source.ts
var app = (0, import_express5.default)();
app.use((0, import_cors.default)());
app.use(import_express5.default.json({ limit: "10mb" }));
var healthHandler = (_req, res) => {
  res.json({
    status: "ok",
    service: "Hereabouts Backend Service",
    anti_instagram_philosophy: "Post less. Go somewhere. Meet someone.",
    demo_mode: config.allowDemoMode,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.use("/api/postcard", postcardRouter);
app.use("/api/meetup", meetupRouter);
app.use("/api/coach", coachRouter);
app.use("/api/group", groupRouter);
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`[Hereabouts] Backend API running at http://localhost:${config.port}`);
  });
}
app.default = app;
module.exports = app;
