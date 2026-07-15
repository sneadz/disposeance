// Trimestre calendaire au format "YYYY-Q{1..4}". Utilise l'heure serveur (UTC).
export function currentQuarter(date: Date = new Date()): string {
  const q = Math.floor(date.getUTCMonth() / 3) + 1
  return `${date.getUTCFullYear()}-Q${q}`
}
