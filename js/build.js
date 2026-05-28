const fs = require('fs')

const config = `const CONFIG = {
  SUPABASE_URL: '${process.env.SUPABASE_URL}',
  SUPABASE_KEY: '${process.env.SUPABASE_KEY}',
  ADMIN_PASSWORD: '${process.env.ADMIN_PASSWORD}'
}`

fs.writeFileSync('./js/config.js', config)
console.log('config.js generated ✅')