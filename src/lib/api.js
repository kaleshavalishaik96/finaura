export async function getForecast(input) {
  const response = await fetch('/api/forecast', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Could not update your forecast.');
  }
  return result;
}
