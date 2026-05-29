// ── State ──────────────────────────────────────────────
let allSnippets = []
let currentLang = 'all'

const LANG_COLORS = {
  html: '#f0914a',
  css: '#4d9de0',
  javascript: '#f5c842',
  typescript: '#3178c6',
  react: '#61dafb',
  vue: '#3ddc84',
  angular: '#dd0031',
  bootstrap: '#7952b3',
  tailwind: '#38bdf8',
  nodejs: '#68a063',
  python: '#e85d8a',
  php: '#777bb4',
  java: '#f89820',
  csharp: '#9b4f96',
  ruby: '#cc342d',
  go: '#00add8',
  django: '#0c4b33',
  flask: '#b8b8c8',
  express: '#8ec07c',
  sql: '#ff6f61',
  mysql: '#00758f',
  postgresql: '#336791',
  mongodb: '#47a248',
  flutter: '#3dd8e0',
  dart: '#0175c2',
  kotlin: '#a97bff',
  swift: '#ff6b35',
  c: '#a8b9cc',
  cpp: '#00599c',
  rust: '#dea584',
  r: '#276dc3',
  numpy: '#4dabcf',
  pandas: '#e70488',
}

const SUPPORTED_LANGS = Object.keys(LANG_COLORS)

// ── DOM refs ───────────────────────────────────────────
const snippetGrid   = document.getElementById('snippetGrid')
const stateLoading  = document.getElementById('stateLoading')
const stateEmpty    = document.getElementById('stateEmpty')
const stateError    = document.getElementById('stateError')
const errorMessage  = document.getElementById('errorMessage')
const totalCount    = document.getElementById('totalCount')
const searchInput   = document.getElementById('searchInput')
const modalOverlay  = document.getElementById('modalOverlay')
const toast         = document.getElementById('toast')
const languageStrip = document.getElementById('languageStrip')
const stripPrev     = document.getElementById('stripPrev')
const stripNext     = document.getElementById('stripNext')

// ── Load & Render ──────────────────────────────────────
async function loadSnippets(lang = currentLang) {
  showState('loading')
  try {
    allSnippets = await getSnippets(lang)
    await updateCounts()
    renderSnippets(allSnippets)
    showState(allSnippets.length === 0 ? 'empty' : 'grid')
  } catch (err) {
    console.error(err)
    errorMessage.textContent = err.message || 'Check your Supabase config.'
    showState('error')
  }
}

function renderSnippets(snippets) {
  snippetGrid.innerHTML = ''
  snippets.forEach((s) => {
    const color = LANG_COLORS[s.language] || '#9090a8'
    const card  = document.createElement('div')
    card.className = 'snip-card open'
    card.dataset.id = s.id

    card.innerHTML = `
      <div class="snip-info">
        <div class="snip-card-header">
          <div class="snip-heading">
            <h2 class="snip-card-title">${escHtml(s.title)}</h2>
            ${s.badge ? `<span class="snip-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">${escHtml(s.badge)}</span>` : ''}
            ${s.docs_url ? `<a class="docs-link" href="${escAttr(s.docs_url)}" target="_blank" rel="noopener noreferrer">Docs</a>` : ''}
          </div>
          <div class="snip-actions">
            <button class="snip-edit"   title="Edit snippet"   data-id="${s.id}">✏️</button>
            <button class="snip-delete" title="Delete snippet" data-id="${s.id}">&times;</button>
          </div>
        </div>
        ${s.description ? `<div class="snip-desc">${formatLessonText(s.description)}</div>` : ''}
      </div>
      <div class="snip-card-body">
        <div class="snip-code-wrap">
          <div class="example-label">Example</div>
          <button class="copy-btn">Copy code</button>
          <pre class="snip-code language-${escHtml(s.language || 'plain')}">${highlightCode(s.code, s.language)}</pre>
        </div>
      </div>`

    // Copy button
    card.querySelector('.copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(s.code).then(() => {
        showToast('Copied to clipboard!', 'success')
      })
    })

    // Edit button
    card.querySelector('.snip-edit').addEventListener('click', () => {
      openEditModal(s)
    })

    // Delete button
    card.querySelector('.snip-delete').addEventListener('click', async () => {
      if (!confirm(`Delete "${s.title}"?`)) return
      try {
        await deleteSnippet(s.id)
        card.remove()
        allSnippets = allSnippets.filter(x => x.id !== s.id)
        await updateCounts()
        if (snippetGrid.children.length === 0) showState('empty')
        showToast('Snippet deleted.', 'success')
      } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error')
      }
    })

    snippetGrid.appendChild(card)
  })
}

// ── State display ──────────────────────────────────────
function showState(state) {
  stateLoading.style.display = state === 'loading' ? 'flex'  : 'none'
  stateEmpty.style.display   = state === 'empty'   ? 'block' : 'none'
  stateError.style.display   = state === 'error'   ? 'block' : 'none'
  snippetGrid.style.display  = state === 'grid'    ? 'grid'  : 'none'
}

// ── Sidebar nav ────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    setActiveLanguage(item.dataset.lang)
  })
})

document.querySelectorAll('.strip-item').forEach(item => {
  item.addEventListener('click', () => {
    setActiveLanguage(item.dataset.langShortcut)
  })
})

if (languageStrip && stripPrev && stripNext) {
  stripPrev.addEventListener('click', () => scrollLanguageStrip(-1))
  stripNext.addEventListener('click', () => scrollLanguageStrip(1))
  languageStrip.addEventListener('scroll', updateStripArrows)
  window.addEventListener('resize', updateStripArrows)
  updateStripArrows()
}

function scrollLanguageStrip(direction) {
  const amount = Math.max(220, languageStrip.clientWidth * 0.7)
  languageStrip.scrollBy({ left: amount * direction, behavior: 'smooth' })
}

function updateStripArrows() {
  const maxScroll = languageStrip.scrollWidth - languageStrip.clientWidth
  stripPrev.disabled = languageStrip.scrollLeft <= 1
  stripNext.disabled = languageStrip.scrollLeft >= maxScroll - 1
}

function setActiveLanguage(lang) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.querySelectorAll('.strip-item').forEach(n => n.classList.remove('active'))

  const sidebarItem = document.querySelector(`.nav-item[data-lang="${lang}"]`)
  const stripItem   = document.querySelector(`.strip-item[data-lang-shortcut="${lang}"]`)

  if (sidebarItem) sidebarItem.classList.add('active')
  if (stripItem)   stripItem.classList.add('active')
  if (stripItem)   stripItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })

  currentLang = lang
  searchInput.value = ''
  loadSnippets(currentLang)
}

// ── Search ─────────────────────────────────────────────
let searchTimer
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const q = searchInput.value.trim()
    if (!q) { loadSnippets(currentLang); return }
    showState('loading')
    try {
      const results = await searchSnippets(q)
      renderSnippets(results)
      showState(results.length === 0 ? 'empty' : 'grid')
    } catch (err) {
      showToast('Search failed: ' + err.message, 'error')
    }
  }, 350)
})

// ── Modal ──────────────────────────────────────────────
document.querySelectorAll('[data-open-add-modal]').forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById('editingId').value         = ''
    document.getElementById('modalTitle').textContent  = 'Add Snippet'
    document.getElementById('saveSnippet').textContent = 'Save Snippet'
    modalOverlay.classList.add('open')
    document.getElementById('inputTitle').focus()
  })
})

function openEditModal(snippet) {
  document.getElementById('editingId').value          = snippet.id
  document.getElementById('modalTitle').textContent   = 'Edit Snippet'
  document.getElementById('saveSnippet').textContent  = 'Update Snippet'
  document.getElementById('inputTitle').value         = snippet.title       || ''
  document.getElementById('inputLanguage').value      = snippet.language    || ''
  document.getElementById('inputBadge').value         = snippet.badge       || ''
  document.getElementById('inputDocsUrl').value       = snippet.docs_url    || ''
  document.getElementById('inputDescription').value   = snippet.description || ''
  document.getElementById('inputTable').value         = ''
  document.getElementById('inputCode').value          = snippet.code        || ''
  modalOverlay.classList.add('open')
  document.getElementById('inputTitle').focus()
}

function closeModal() {
  modalOverlay.classList.remove('open')
  document.getElementById('editingId').value          = ''
  document.getElementById('modalTitle').textContent   = 'Add Snippet'
  document.getElementById('saveSnippet').textContent  = 'Save Snippet'
  document.getElementById('inputTitle').value         = ''
  document.getElementById('inputLanguage').value      = ''
  document.getElementById('inputBadge').value         = ''
  document.getElementById('inputDocsUrl').value       = ''
  document.getElementById('inputDescription').value   = ''
  document.getElementById('inputTable').value         = ''
  document.getElementById('inputCode').value          = ''
}

document.getElementById('closeModal').addEventListener('click', closeModal)
document.getElementById('cancelModal').addEventListener('click', closeModal)

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal()
})

document.getElementById('saveSnippet').addEventListener('click', async () => {
  const editingId = document.getElementById('editingId').value
  const title     = document.getElementById('inputTitle').value.trim()
  const language  = document.getElementById('inputLanguage').value
  const badge     = document.getElementById('inputBadge').value.trim()
  const docsUrl   = document.getElementById('inputDocsUrl').value.trim()
  const desc      = document.getElementById('inputDescription').value.trim()
  const table     = document.getElementById('inputTable').value.trim()
  const code      = document.getElementById('inputCode').value.trim()

  if (!title || !language || !code) {
    showToast('Title, language, and code are required.', 'error')
    return
  }

  if (docsUrl && !isValidUrl(docsUrl)) {
    showToast('Enter a valid documentation URL.', 'error')
    return
  }

  const btn = document.getElementById('saveSnippet')
  btn.disabled    = true
  btn.textContent = editingId ? 'Updating...' : 'Saving...'

  const payload = {
    title,
    language,
    badge,
    docs_url: docsUrl || null,
    description: combineLessonNotes(desc, table),
    code
  }

  try {
    if (editingId) {
      await updateSnippet(editingId, payload)
      showToast('Snippet updated! ✅', 'success')
    } else {
      await addSnippet(payload)
      showToast('Snippet saved! ✅', 'success')
    }
    closeModal()
    loadSnippets(currentLang)
  } catch (err) {
    showToast('Failed: ' + err.message, 'error')
  } finally {
    btn.disabled    = false
    btn.textContent = editingId ? 'Update Snippet' : 'Save Snippet'
  }
})

// ── Mobile menu ────────────────────────────────────────
const sidebar  = document.getElementById('sidebar')
const menuBtn  = document.getElementById('menuBtn')

// Create backdrop element
const backdrop = document.createElement('div')
backdrop.className = 'sidebar-backdrop'
document.body.appendChild(backdrop)

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open')
  backdrop.classList.toggle('show')
})

backdrop.addEventListener('click', () => {
  sidebar.classList.remove('open')
  backdrop.classList.remove('show')
})

// ── Counts ─────────────────────────────────────────────
async function updateCounts() {
  const { data, error } = await db.from('snippets').select('language')
  if (error) throw error
  if (!data) return

  const all = data.length
  totalCount.textContent = all
  document.getElementById('count-all').textContent = all

  SUPPORTED_LANGS.forEach(lang => {
    const el = document.getElementById(`count-${lang}`)
    if (el) el.textContent = data.filter(s => s.language === lang).length
  })
}

// ── Helpers ────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escAttr(str) {
  return escHtml(str).replace(/'/g, '&#39;')
}

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function formatLessonText(text) {
  return String(text)
    .trim()
    .split(/\n{2,}/)
    .map(formatLessonBlock)
    .join('')
}

function combineLessonNotes(description, table) {
  return [description, table].filter(Boolean).join('\n\n')
}

function formatLessonBlock(block) {
  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return ''

  if (lines.every(line => /^[-*]\s+/.test(line))) {
    return `<ul>${lines.map(line => `<li>${formatInlineCode(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`
  }

  if (lines.length > 1 && lines.every(line => line.includes('|'))) {
    return formatLessonTable(lines)
  }

  return `<p>${lines.map(formatInlineCode).join('<br>')}</p>`
}

function formatLessonTable(lines) {
  const rows = lines
    .filter(line => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
    .map(line => line.split('|').map(cell => cell.trim()).filter(Boolean))

  if (rows.length === 0) return ''

  const [head, ...body] = rows
  return `
    <div class="lesson-table-wrap">
      <table class="lesson-table">
        <thead><tr>${head.map(cell => `<th>${formatInlineCode(cell)}</th>`).join('')}</tr></thead>
        <tbody>${body.map(row => `<tr>${row.map(cell => `<td>${formatInlineCode(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`
}

function formatInlineCode(text) {
  return escHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>')
}

function highlightCode(code, language = '') {
  const lang = String(language).toLowerCase()

  if (lang === 'html') return highlightHtml(code)
  if (lang === 'css') return highlightCss(code)
  if (lang === 'sql' || lang === 'mysql' || lang === 'postgresql') return highlightGeneric(code, SQL_KEYWORDS)
  if (['python','django','flask','numpy','pandas'].includes(lang)) return highlightGeneric(code, PYTHON_KEYWORDS)
  if (['javascript','typescript','vue','react','angular','nodejs','express'].includes(lang)) return highlightGeneric(code, JS_KEYWORDS)
  if (['flutter','dart'].includes(lang)) return highlightGeneric(code, DART_KEYWORDS)
  if (['java','c','cpp','csharp','go','rust','kotlin','swift','php','ruby','r'].includes(lang)) return highlightGeneric(code, C_STYLE_KEYWORDS)

  return escHtml(code)
}

const JS_KEYWORDS = [
  'async','await','break','case','catch','class','const','continue','default','else','export',
  'extends','finally','for','from','function','if','import','let','new','return','switch',
  'throw','try','typeof','var','while','yield','true','false','null','undefined'
]

const DART_KEYWORDS = [
  'abstract','as','async','await','break','case','catch','class','const','continue','default',
  'else','extends','final','for','Future','if','import','in','new','override','return','static',
  'super','this','true','false','null','void','while','Widget','State','String'
]

const PYTHON_KEYWORDS = [
  'and','as','assert','async','await','break','class','continue','def','del','elif','else',
  'except','False','finally','for','from','global','if','import','in','is','lambda','None',
  'nonlocal','not','or','pass','raise','return','True','try','while','with','yield'
]

const SQL_KEYWORDS = [
  'ADD','ALTER','AND','AS','ASC','BETWEEN','BY','CREATE','DATABASE','DELETE','DESC',
  'DISTINCT','DROP','FROM','GROUP','HAVING','IN','INSERT','INTO','IS','JOIN','KEY',
  'LIMIT','NOT','NULL','ON','OR','ORDER','PRIMARY','SELECT','SET','TABLE','UPDATE',
  'VALUES','WHERE'
].flatMap(word => [word, word.toLowerCase()])

const C_STYLE_KEYWORDS = [
  'abstract','auto','bool','break','case','catch','char','class','const','continue',
  'def','default','defer','do','double','else','enum','extends','false','final',
  'float','for','func','function','go','guard','if','implements','import','in','int',
  'interface','let','long','match','mut','namespace','new','nil','null','override',
  'package','private','protected','public','return','self','static','String','struct',
  'super','switch','this','throw','true','try','type','using','var','void','while'
]

function highlightGeneric(code, keywords) {
  const keywordPattern = keywords.join('|')
  const tokenRegex = new RegExp(
    `(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|\\\`(?:\\\\.|[^\\\`\\\\])*\\\`|\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/|#.*|\\b(?:${keywordPattern})\\b|\\b\\d+(?:\\.\\d+)?\\b|[{}()[\\].,;:<>+\\-*\\/%=!&|?]+)`,
    'g'
  )

  return highlightByRegex(code, tokenRegex, token => {
    if (/^(\/\/|\/\*|#)/.test(token)) return 'comment'
    if (/^["'`]/.test(token)) return 'string'
    if (/^\d/.test(token)) return 'number'
    if (keywords.includes(token)) return 'keyword'
    return 'punct'
  })
}

function highlightCss(code) {
  const tokenRegex = /(\/\*[\s\S]*?\*\/|#[0-9a-fA-F]{3,8}\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[.#]?[a-zA-Z_-][\w-]*(?=\s*:)|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b|[{}()[\].,;:>+~*=]+)/g

  return highlightByRegex(code, tokenRegex, token => {
    if (token.startsWith('/*')) return 'comment'
    if (token.startsWith('#')) return 'number'
    if (/^["']/.test(token)) return 'string'
    if (/^\d/.test(token)) return 'number'
    if (/^[.#]?[a-zA-Z_-]/.test(token)) return 'property'
    return 'punct'
  })
}

function highlightHtml(code) {
  const tokenRegex = /(<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g

  return highlightByRegex(code, tokenRegex, token => {
    if (token.startsWith('<!--')) return 'comment'
    if (token.startsWith('<')) return 'tag'
    return 'string'
  })
}

function highlightByRegex(code, regex, getType) {
  let html = ''
  let lastIndex = 0

  for (const match of String(code).matchAll(regex)) {
    html += escHtml(String(code).slice(lastIndex, match.index))
    html += `<span class="tok-${getType(match[0])}">${escHtml(match[0])}</span>`
    lastIndex = match.index + match[0].length
  }

  html += escHtml(String(code).slice(lastIndex))
  return html
}

let toastTimer
function showToast(msg, type = 'success') {
  toast.textContent = msg
  toast.className = `toast show ${type}`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800)
}

// ── Init ───────────────────────────────────────────────
loadSnippets()

// ── Admin mode ─────────────────────────────────────────
let isAdmin = false

function enableAdminMode() {
  isAdmin = true
  document.body.classList.add('is-admin')
  showToast('Admin mode enabled 🔓', 'success')
}

function disableAdminMode() {
  isAdmin = false
  document.body.classList.remove('is-admin')
  showToast('Admin mode disabled 🔒', 'success')
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    if (isAdmin) {
      disableAdminMode()
      return
    }
    const input = prompt('Enter admin password:')
    if (input === CONFIG.ADMIN_PASSWORD) {
      enableAdminMode()
    } else if (input !== null) {
      showToast('Wrong password.', 'error')
    }
  }
})