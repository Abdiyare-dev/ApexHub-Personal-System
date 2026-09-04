import { createClient } from './supabase/client.js';
import { formatError } from './formatError.js';

export const DEFAULT_CATEGORIES = [
  // Income
  { name: "Salary", type: "income", icon: "💼", color: "#10B981" },
  { name: "Freelance", type: "income", icon: "💻", color: "#3B82F6" },
  { name: "Other Income", type: "income", icon: "💰", color: "#8B5CF6" },
  // Expense
  { name: "Food & Dining", type: "expense", icon: "🍽", color: "#EF4444" },
  { name: "Transport", type: "expense", icon: "🚗", color: "#F97316" },
  { name: "Housing", type: "expense", icon: "🏠", color: "#EAB308" },
  { name: "Utilities", type: "expense", icon: "⚡", color: "#06B6D4" },
  { name: "Education", type: "expense", icon: "📚", color: "#8B5CF6" },
  { name: "Health", type: "expense", icon: "🏥", color: "#EC4899" },
  { name: "Entertainment", type: "expense", icon: "🎮", color: "#14B8A6" },
  { name: "Shopping", type: "expense", icon: "🛒", color: "#F59E0B" },
  { name: "Savings", type: "expense", icon: "🏦", color: "#6366F1" },
  { name: "Other", type: "expense", icon: "📌", color: "#6B7280" },
];

/**
 * Checks if user has categories in the database and seeds defaults if none exist.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function seedDefaultCategories(userId) {
  if (!userId) return [];
  const supabase = createClient();

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      // Recoverable: we return [] and the UI renders empty rather than breaking.
      // console.warn (not .error) so Next.js dev overlay does not report it as a crash.
      console.warn('[seedCategories] could not read categories:', formatError(fetchError));
      return [];
    }

    if (existing && existing.length > 0) {
      return existing;
    }

    // Insert defaults
    const toInsert = DEFAULT_CATEGORIES.map((cat) => ({
      user_id: userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert(toInsert)
      .select();

    if (insertError) {
      console.warn('[seedCategories] could not insert defaults:', formatError(insertError));
      return [];
    }

    return inserted || [];
  } catch (err) {
    console.error('[seedCategories] unexpected failure:', formatError(err));
    return [];
  }
}
