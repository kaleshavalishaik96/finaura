import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedPresetBody } from '../src/data/presets.js';
import { buildSampleExplanationContext, explainFictionalSample } from '../src/services/sampleExplanation.js';

test('Gemini endpoint payload accepts only one allowlisted preset ID', () => {
  assert.equal(isAllowedPresetBody({ presetId: 'reduce-dining-10' }), true);
  assert.equal(isAllowedPresetBody({ presetId: 'reduce-dining-10', balance: 12345 }), false);
  assert.equal(isAllowedPresetBody({ question: 'personal question' }), false);
  assert.equal(isAllowedPresetBody({ presetId: 'unknown' }), false);
});

test('sample explanation context is rebuilt from fiction and contains no caller-provided amounts', () => {
  const context = buildSampleExplanationContext('negative-projection', '2026-10-25');
  assert.match(context.summary, /Fictional sample only/);
  assert.equal(Number.isSafeInteger(context.facts.projectionMinor), true);
  assert.doesNotMatch(JSON.stringify(context), /private-bank-secret|987654321/);
});

test('Gemini unavailability returns deterministic sample fallback', async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const result = await explainFictionalSample('practical-savings');
    assert.equal(result.source, 'fallback');
    assert.match(result.explanation, /Protect your planned essentials/);
  } finally {
    if (saved === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = saved;
  }
});

test('Gemini receives only the fixed fictional context and numeric claims fall back', async () => {
  const savedKey = process.env.GEMINI_API_KEY;
  const savedFetch = globalThis.fetch;
  let requestBody;
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ output_text: 'Review flexible costs and protect your remaining buffer.' }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const result = await explainFictionalSample('reduce-dining-10');
    assert.equal(result.source, 'gemini');
    assert.equal(requestBody.store, false);
    assert.match(requestBody.input, /Fictional sample only/);
    assert.doesNotMatch(requestBody.input, /987654321|private-bank-secret/);
    assert.equal(result.facts.diningCutMinor, 6000);

    globalThis.fetch = async () => new Response(JSON.stringify({ output_text: 'Reduce spending by twenty percent and save 500.' }), { status: 200, headers: { 'content-type': 'application/json' } });
    const guarded = await explainFictionalSample('reduce-dining-10');
    assert.equal(guarded.source, 'fallback');
  } finally {
    globalThis.fetch = savedFetch;
    if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedKey;
  }
});
