const fs = require('fs')
const p =
  'C:/Users/andreia.marques/.cursor/projects/c-Users-andreia-marques-OneDrive-Turismo-de-Portugal-IP-Projectos-CharacterForge/agent-tools/67d7a916-b81e-46f0-8035-bbceeb09d68a.txt'
const lines = fs.readFileSync(p, 'utf8').split(/\n/)
const chunk = lines.slice(1795, 1910).join('\n')
fs.writeFileSync('tmp-sorcerer-spells.txt', chunk)
console.log('wrote', chunk.length)
