const { createClient } = supabase

const db = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)

async function getSnippets(language = 'all') {
  let query = db
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: false })

  if (language && language !== 'all') {
    query = query.eq('language', language)
  }

  const { data, error } = await query
  if (error) throw error

  return data || []
}

async function searchSnippets(term) {
  const q = `%${term}%`
  const { data, error } = await db
    .from('snippets')
    .select('*')
    .or(`title.ilike.${q},description.ilike.${q},code.ilike.${q},language.ilike.${q},badge.ilike.${q}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

async function addSnippet(snippet) {
  const { data, error } = await db
    .from('snippets')
    .insert({
      title: snippet.title,
      language: snippet.language,
      badge: snippet.badge || null,
      docs_url: snippet.docs_url || null,
      description: snippet.description || null,
      code: snippet.code,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

async function deleteSnippet(id) {
  const { error } = await db
    .from('snippets')
    .delete()
    .eq('id', id)

  if (error) throw error
}
