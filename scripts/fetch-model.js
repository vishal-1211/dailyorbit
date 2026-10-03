#!/usr/bin/env node
/* Downloads the pre-trained language model (all-MiniLM-L6-v2, about 25 MB) into ./models.
   Run once at build time. It is a plain public download: nothing about you is sent.
   The app itself never downloads the model; if these files are missing it simply
   uses its built-in self-taught model instead. */
const fs = require('fs');
const path = require('path');

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const BASE = `https://huggingface.co/${MODEL}/resolve/main/`;
// [file, minimum plausible size in bytes]
const FILES = [['config.json', 200], ['tokenizer.json', 100000], ['tokenizer_config.json', 100], ['special_tokens_map.json', 50], ['onnx/model_quantized.onnx', 15 * 1024 * 1024]];
const dest = path.join(__dirname, '..', 'models', ...MODEL.split('/'));

async function get(file, min) {
  const out = path.join(dest, file);
  if (fs.existsSync(out) && fs.statSync(out).size >= min) { console.log(`  have   ${file}`); return; }
  const res = await fetch(BASE + file, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < min) throw new Error(`${file}: download looks incomplete (${buf.length} bytes)`);
  if (file.endsWith('.json')) JSON.parse(buf.toString('utf8')); // must be valid
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out + '.part', buf); fs.renameSync(out + '.part', out);
  console.log(`  saved  ${file} (${(buf.length / 1048576).toFixed(1)} MB)`);
}

(async () => {
  if (typeof fetch !== 'function') { console.log('Node 18 or newer is needed to download the language model. Skipping; the app will use its self-taught model.'); return; }
  console.log(`Fetching the pre-trained language model (${MODEL})…`);
  try {
    for (const [f, min] of FILES) await get(f, min);
    console.log('Language model ready.');
  } catch (e) {
    console.log(`Could not download the language model (${e.message}).`);
    console.log('That is fine: the app will use its built-in self-taught model. Run "npm run fetch-model" to try again later.');
  }
})();
