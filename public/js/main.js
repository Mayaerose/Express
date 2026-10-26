// The front end: talks to the API with fetch() to create, read, update and delete affirmations

const form = document.querySelector('#addForm')
const input = document.querySelector('#newText')
const list = document.querySelector('#list')
const message = document.querySelector('#message')
const count = document.querySelector('#count')
const empty = document.querySelector('#empty')

// ---------- helpers ----------

// build elements with textContent so nothing typed in can be treated as HTML
function el (tag, props = {}, ...children) {
  const node = document.createElement(tag)
  Object.assign(node, props)
  children.forEach(child => node.append(child))
  return node
}

function say (text, isError) {
  message.textContent = text
  message.className = isError ? 'message error' : 'message'
}

function prettyDate (iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function updateCount () {
  const n = list.children.length
  count.textContent = n === 1 ? '1 affirmation' : n + ' affirmations'
  empty.hidden = n > 0
  count.hidden = n === 0
}

// ---------- show one affirmation ----------

function makeCard (a) {
  const card = el('li', { className: 'card' })
  card.dataset.id = a._id
  showView(card, a)
  return card
}

function showView (card, a) {
  const edit = el('button', { className: 'btn-soft', type: 'button' }, 'Edit')
  const del = el('button', { className: 'btn-del', type: 'button' }, 'Delete')
  edit.addEventListener('click', () => showEdit(card, a))
  del.addEventListener('click', () => removeAffirmation(card, a))

  const edited = a.updatedAt !== a.createdAt ? ' (edited)' : ''
  card.replaceChildren(
    el('p', { className: 'text' }, a.text),
    el('p', { className: 'date' }, prettyDate(a.createdAt) + edited),
    el('div', { className: 'actions' }, edit, del)
  )
}

// ---------- READ ALL ----------

async function loadAffirmations () {
  try {
    const res = await fetch('/api/affirmations')
    const data = await res.json()
    list.replaceChildren(...data.map(makeCard))
    updateCount()
  } catch (err) {
    say('Could not load your affirmations. Is the server running?', true)
  }
}

// ---------- CREATE ----------

form.addEventListener('submit', async event => {
  event.preventDefault()
  const res = await fetch('/api/affirmations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.value })
  })
  const data = await res.json()
  if (!res.ok) return say(data.error, true)
  list.prepend(makeCard(data)) // newest on top
  input.value = ''
  say('Saved! You deserve kind words.', false)
  updateCount()
})

// ---------- UPDATE ----------

function showEdit (card, a) {
  const field = el('input', { className: 'edit-input', type: 'text', value: a.text })
  const save = el('button', { type: 'button' }, 'Save')
  const cancel = el('button', { className: 'btn-soft', type: 'button' }, 'Cancel')

  cancel.addEventListener('click', () => showView(card, a))
  save.addEventListener('click', async () => {
    const res = await fetch('/api/affirmations/' + a._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: field.value })
    })
    const data = await res.json()
    if (!res.ok) return say(data.error, true)
    showView(card, data)
    say('Updated!', false)
  })

  card.replaceChildren(field, el('div', { className: 'actions' }, save, cancel))
  field.focus()
}

// ---------- DELETE ----------

async function removeAffirmation (card, a) {
  if (!confirm('Delete this affirmation?')) return
  const res = await fetch('/api/affirmations/' + a._id, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    return say(data.error, true)
  }
  card.remove()
  say('Deleted.', false)
  updateCount()
}

loadAffirmations()
