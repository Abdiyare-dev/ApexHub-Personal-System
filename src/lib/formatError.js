/**
 * Turns a Supabase/PostgREST error, a native Error, or anything else into a
 * readable string.
 *
 * Why this exists: `console.error('msg:', err)` renders as an unhelpful `{}`
 * whenever `err` is a native Error (its `message`/`stack` are non-enumerable)
 * or a PostgrestError whose fields don't survive serialization. That hides the
 * one piece of information needed to diagnose the failure.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function formatError(err) {
  if (err == null) return 'unknown error (no error object)';

  if (typeof err === 'string') return err;

  // Supabase / PostgREST errors: { message, code, details, hint }
  const parts = [];
  if (err.message) parts.push(err.message);
  if (err.code) parts.push(`code=${err.code}`);
  if (err.details) parts.push(`details=${err.details}`);
  if (err.hint) parts.push(`hint=${err.hint}`);
  if (parts.length) return parts.join(' | ');

  // Native Error with a name but no enumerable message
  if (err instanceof Error) return `${err.name}: ${err.message}`;

  try {
    const json = JSON.stringify(err);
    return json && json !== '{}' ? json : `unrecognized error shape (${Object.prototype.toString.call(err)})`;
  } catch {
    return String(err);
  }
}
