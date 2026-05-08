import type { Config } from 'tailwindcss'
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { asorta: { black:'#0B0B0B', graphite:'#1A1A1A', silver:'#D6D6D6', olive:'#5B6653', steel:'#2A2D2B'}}, boxShadow: { glow:'0 0 40px rgba(214,214,214,.08)' } } }, plugins: [] }
export default config
