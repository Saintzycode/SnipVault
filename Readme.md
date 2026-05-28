# SnipVault

A personal code snippets reference site built with plain HTML/CSS/JS and Supabase.

## Setup

1. Clone the repo
2. Copy `js/config.example.js` → `js/config.js`
3. Fill in your Supabase URL and anon key in `config.js`
4. Create a `snippets` table in Supabase (see schema below)
5. Open `index.html` with Live Server

## Supabase Table Schema

| Column       | Type        | Notes              |
|--------------|-------------|--------------------|
| id           | uuid        | Primary key, auto  |
| title        | text        | required           |
| code         | text        | required           |
| language     | text        | e.g. javascript    |
| badge        | text        | e.g. ES6+          |
| description  | text        |                    |
| created_at   | timestamptz | auto               |

## Stack

- Frontend: Plain HTML, CSS, JavaScript
- Backend: Supabase (PostgreSQL + REST API)
- Font: Syne + Space Mono (Google Fonts)