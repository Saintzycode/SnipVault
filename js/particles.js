// Fetch snippets — optionally filter by language
async function getSnippets(language = null) {
  let query = db
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: false })

  if (language && language !== 'all') {
    query = query.eq('language', language)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// Add a new snippet
async function addSnippet({ title, language, badge, docs_url, description, code }) {
  const { data, error } = await db
    .from('snippets')
    .insert([{ title, language, badge, docs_url, description, code }])
    .select()

  if (error) throw error
  return data[0]
}

// Delete a snippet by id
async function deleteSnippet(id) {
  const { error } = await db
    .from('snippets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Search snippets by keyword
async function searchSnippets(query) {
  const { data, error } = await db
    .from('snippets')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
// Update a snippet by id
async function updateSnippet(id, { title, language, badge, docs_url, description, code }) {
  const { data, error } = await db
    .from('snippets')
    .update({ title, language, badge, docs_url, description, code })
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}