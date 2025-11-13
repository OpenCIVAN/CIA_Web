// src/llm/askWebLLM.js
// Up to 3 findings, mesh-type aware neutral regions, no ribs/spine on non-ribcage meshes.

import { CreateMLCEngine } from "@mlc-ai/web-llm";

const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";

let enginePromise = null;

// -------------------------
// Lazy init engine
// -------------------------
async function getEngine() {
  if (!enginePromise) {
    console.log("[WebLLM] Initializing engine with model:", MODEL_ID);
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback(p) {
        console.log("[WebLLM init]", p);
      },
    });
  }
  return enginePromise;
}

// -------------------------
// Helper: extract largest balanced JSON object
// -------------------------
function extractBalancedJSON(raw) {
  if (!raw) return null;
  const text = String(raw);
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

// -------------------------
// Helper: safe JSON parse with repair
// -------------------------
function safeParseJSON(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_) {}

  const repaired = extractBalancedJSON(raw);
  if (repaired) {
    try {
      return JSON.parse(repaired);
    } catch (_) {}
  }

  console.warn("[WebLLM] Could not extract valid JSON, returning null.");
  return null;
}

// -------------------------
// Region templates per mesh type (Option B: neutral anatomical)
// -------------------------
const regionTemplatesByType = {
  ribcage: [
    "upper rib cage region",
    "lower rib cage region",
    "left chest wall area",
    "right chest wall area",
    "central anterior chest region"
  ],
  skull: [
    "upper skull region",
    "lower skull region",
    "left cranial side",
    "right cranial side",
    "central skull base region"
  ],
  lungs: [
    "upper lung area",
    "middle lung area",
    "lower lung area",
    "left lung area",
    "right lung area",
    "central lung region"
  ],
  lung_vessels: [
    "upper vascular cluster",
    "central vessel cluster",
    "peripheral vessel branches",
    "lower vascular region"
  ],
  ventricles: [
    "upper ventricular region",
    "lower ventricular region",
    "left ventricular area",
    "right ventricular area",
    "central ventricular region"
  ],
  unknown: [
    "upper region",
    "lower region",
    "left region",
    "right region",
    "central region"
  ],
};

const bannedWords = ["rib", "ribs", "spine", "vertebra", "vertebrae", "pelvis", "pelvic"];

// -------------------------
// PUBLIC FUNCTION
// -------------------------
export async function askLLM_WebLLM(stats) {
  const engine = await getEngine();

  const meshType = stats.meshType || "unknown";
  const regionExamples =
    regionTemplatesByType[meshType] || regionTemplatesByType.unknown;
  const regionExampleText = regionExamples.map(r => `- "${r}"`).join("\n");

  // normalize hotspot field name
  const hotspot = stats.hotspot || stats.hotspots || {};
  const densityHotspots   = Array.isArray(hotspot.density)   ? hotspot.density   : [];
  const curvatureHotspots = Array.isArray(hotspot.curvature) ? hotspot.curvature : [];
  const symmetryHotspots  = Array.isArray(hotspot.symmetry)  ? hotspot.symmetry  : [];

  const allowedSignals = new Set(["density", "curvature", "symmetry"]);
  const allowedTypes   = new Set(["fracture", "asymmetry", "anomaly", "artifact"]);

  const allowedIndices = new Set([
    ...densityHotspots,
    ...curvatureHotspots,
    ...symmetryHotspots,
  ]);



  const compactStats = {
    meshType: stats.meshType || "unknown",
    bboxSize: stats.bboxSize || { x:0,y:0,z:0 },
    hotspotSample: {
      density:   densityHotspots,
      curvature: curvatureHotspots,
      symmetry:  symmetryHotspots
    }
  };


  // -------------------------
  // SYSTEM PROMPT
  // -------------------------
  const systemPrompt = `
You are an assistant running entirely inside a browser.

RULES (MUST follow all):

1. Answer ONLY in ENGLISH.
2. Output MUST be a single valid JSON object. No markdown, no backticks, no extra text.
3. The top-level JSON MUST have:
   - "findings": an array with between 1 and 3 objects.
   - "summary": a short, 1–3 sentence radiology-style summary in plain English.
4. If you cannot follow ALL rules, return exactly:
   { "findings": [], "summary": "" }

Each finding MUST match this schema:

{
  "type": "fracture" | "asymmetry" | "anomaly" | "artifact",
  "signal": "density" | "curvature" | "symmetry",
  "regionHint": "short neutral description of where on the object the finding is (see examples)",
  "confidence": number between 0 and 1,
  "indices": [numbers ONLY from the hotspotSample lists]
}

Mesh type information:

- meshType = "${meshType}"

When choosing "regionHint", follow these examples for this mesh type:

${regionExampleText}

Constraints on regionHint:

- Use only short, neutral phrases similar to the examples above.
- Do NOT mention "ribs", "rib cage", "spine", "vertebra", "vertebrae", "pelvis", or "pelvic" UNLESS meshType is "ribcage".
- Do NOT mention organs or structures that do not align with meshType.
- If meshType is "unknown", use only generic phrases like "upper region", "lower region", "left region", "right region", "central region".

Other constraints:

- Use AT MOST 3 findings.
- Try to cover different signals if possible (e.g., one for density, one for curvature, one for symmetry).
- If a signal has no hotspots, you may skip it.
- "indices" must be chosen ONLY from hotspotSample.density/curvature/symmetry.
  Never invent new numbers.
- It is OK if some findings have an empty "indices" array.
- Use cautious wording like "possible", "suggestive of", "may represent" instead of strong diagnoses.
`;

  const userPrompt =
    "Here are compact mesh statistics and hotspot indices for a 3D surface.\n" +
    "Produce between 1 and 3 findings following the JSON schema.\n\n" +
    JSON.stringify(compactStats);

  try {
    const completion = await engine.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      stream: false,
      response_format: { type: "json_object" },
    });

    const raw = completion?.choices?.[0]?.message?.content ?? "{}";
    console.log("=== RAW MODEL OUTPUT ===\n", raw);

    const parsed = safeParseJSON(raw);
    if (!parsed) {
      return { findings: [], summary: "" };
    }

    let findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    let summary  = typeof parsed.summary === "string" ? parsed.summary : "";

    // limit to 1–3
    if (findings.length > 3) findings = findings.slice(0, 3);
    if (!findings.length) {
      findings = [
        {
          type: "anomaly",
          signal: "density",
          regionHint: regionExamples[0] || "central region",
          confidence: 0.3,
          indices: [],
        },
      ];
    }

    const resultFindings = [];
    for (let idx = 0; idx < findings.length; idx++) {
      const fIn = findings[idx] || {};
      const f = { ...fIn };

      // --- type ---
      if (typeof f.type !== "string") f.type = "anomaly";
      f.type = f.type.toLowerCase().trim();
      if (!allowedTypes.has(f.type)) {
        if (f.type.includes("fract")) f.type = "fracture";
        else if (f.type.includes("asym")) f.type = "asymmetry";
        else if (f.type.includes("artif")) f.type = "artifact";
        else f.type = "anomaly";
      }

      // --- signal ---
      if (typeof f.signal !== "string") f.signal = "density";
      f.signal = f.signal.toLowerCase().trim();
      if (!allowedSignals.has(f.signal)) {
        if (f.signal.includes("curv")) f.signal = "curvature";
        else if (f.signal.includes("symm")) f.signal = "symmetry";
        else f.signal = "density";
      }

      // --- regionHint ---
      if (typeof f.regionHint !== "string") {
        f.regionHint = regionExamples[0] || "central region";
      } else {
        f.regionHint = f.regionHint.trim() || (regionExamples[0] || "central region");
      }

      // If model still sneaks in ribs/spine for non-ribcage meshes, overwrite.
      if (meshType !== "ribcage") {
        const lower = f.regionHint.toLowerCase();
        if (bannedWords.some(w => lower.includes(w))) {
          f.regionHint = regionExamples[0] || "central region";
        }
      }

      // --- confidence ---
      let c = Number(f.confidence);
      if (!Number.isFinite(c)) c = 0.6;
      c = Math.max(0, Math.min(1, c));
      f.confidence = c;

      // --- indices ---
      if (!Array.isArray(f.indices)) f.indices = [];
      f.indices = f.indices.filter(
        (x) => typeof x === "number" && allowedIndices.has(x)
      );

      if (!f.indices.length && allowedIndices.size > 0) {
        let source = [];
        if (f.signal === "density") source = densityHotspots;
        else if (f.signal === "curvature") source = curvatureHotspots;
        else if (f.signal === "symmetry") source = symmetryHotspots;

        if (!source.length) source = Array.from(allowedIndices);
        f.indices = source.slice(0, 20);
      }

      resultFindings.push(f);
    }

    if (!resultFindings.length) {
      resultFindings.push({
        type: "anomaly",
        signal: "density",
        regionHint: regionExamples[0] || "central region",
        confidence: 0.3,
        indices: Array.from(allowedIndices).slice(0, 20),
      });
    }

    if (!summary) {
      const signalsUsed = Array.from(
        new Set(resultFindings.map((f) => f.signal))
      );
      summary = `Automatic interpretation produced ${
        resultFindings.length
      } finding(s) involving ${signalsUsed.join(", ")} hotspots.`;
    }

    return { findings: resultFindings, summary };
  } catch (err) {
    console.error("[WebLLM] ERROR:", err);
    return { findings: [], summary: "" };
  }
}
