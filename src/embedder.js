// Optional pre-trained language model (all-MiniLM-L6-v2), run entirely on this laptop.
// It turns a piece of text into a list of numbers that captures its meaning, so the paper
// can tell that two stories are about similar things even when they share no words.
//
// The model files are installed at build time (scripts/fetch-model.js). At run time the
// library is forbidden from downloading anything. If the files or the library are missing,
// or anything fails, the app carries on with its built-in self-taught model.
const fs = require('fs');
const path = require('path');

const MODEL = 'Xenova/all-MiniLM-L6-v2';
let extractor = null;
let attempt = null;
let status = { available: false, reason: 'not checked yet', model: MODEL };

function init(modelsDir) {
  if (attempt) return attempt;
  attempt = (async () => {
    try {
      if (!fs.existsSync(path.join(modelsDir, ...MODEL.split('/'), 'onnx', 'model_quantized.onnx'))) {
        status = { available: false, reason: 'model files are not installed', model: MODEL }; return status;
      }
      let T;
      try { T = require('@huggingface/transformers'); } catch { T = await import('@huggingface/transformers'); }
      T.env.allowRemoteModels = false;          // never fetch anything while the app runs
      T.env.allowLocalModels = true;
      T.env.localModelPath = modelsDir + path.sep;
      T.env.useFSCache = false;
      extractor = await T.pipeline('feature-extraction', MODEL, { dtype: 'q8', local_files_only: true });
      const probe = await run(['a quick self-test']);
      if (!probe[0] || probe[0].length < 64) throw new Error('unexpected output from the model');
      status = { available: true, reason: '', model: MODEL, dim: probe[0].length };
    } catch (e) {
      extractor = null;
      status = { available: false, reason: String(e && e.message || e).slice(0, 200), model: MODEL };
    }
    return status;
  })();
  return attempt;
}

async function run(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 16) {
    const batch = texts.slice(i, i + 16).map(t => String(t || '').slice(0, 1200));
    const tensor = await extractor(batch, { pooling: 'mean', normalize: true });
    for (const row of tensor.tolist()) out.push(row.map(x => Math.round(x * 1e4) / 1e4));
  }
  return out;
}

/** Returns one vector per text, or null if the pre-trained model is not available. */
async function embed(modelsDir, texts) {
  const s = await init(modelsDir);
  if (!s.available || !Array.isArray(texts) || !texts.length) return null;
  try { return await run(texts.slice(0, 400)); } catch (e) { status = { ...status, available: false, reason: String(e.message || e).slice(0, 200) }; return null; }
}

module.exports = { init, embed, getStatus: () => status, MODEL };
