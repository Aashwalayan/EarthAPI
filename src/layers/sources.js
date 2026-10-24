// Retrieval helpers. A layer's `load()` decides where its data comes from:
// a bundled static file (this layer), a periodically refreshed URL, or a live
// feed. Every layer returns the same thing (normalized Features), so the globe
// code never needs to know which kind it is.

/** Fetch JSON with clear errors (a missing file in dev returns index.html, not a 404). */
export async function fetchJson(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error(`Expected JSON from ${url} but received something else`);
  }
}
