import catalog from '../data/symbtr-catalog.json'

export interface DatasetMakamOption {
  id: string
  count: number
  curated: boolean
}

export interface DatasetUsulOption {
  id: string
  count: number
}

export interface MakamOption extends DatasetMakamOption {
  label: string
}

interface DatasetCatalog {
  source: {
    symbtrPieces: number
    makams: number
    usuls: number
    curatedMakams: number
  }
  makams: DatasetMakamOption[]
  usuls: DatasetUsulOption[]
}

const dataset = catalog as DatasetCatalog

const MAKAM_LABEL_OVERRIDES: Record<string, string> = {
  acemkurdi: 'Acemkürdi',
  acemasiran: 'Acemaşiran',
  karcigar: 'Karcığar',
  kurdilihicazkar: 'Kürdilihicazkar',
  nihavent: 'Nihavent',
  huseyni: 'Hüseyni',
  ussak: 'Uşşak'
}

const USUL_LABEL_OVERRIDES: Record<string, string> = {
  agir_aksaksemai: 'Ağır Aksak Semai',
  agiraksak: 'Ağır Aksak',
  agirduyek: 'Ağır Düyek',
  aksaksemai: 'Aksak Semai',
  ciftesofyan: 'Çifte Sofyan',
  devrihindi: 'Devr-i Hindi',
  devrikebir: 'Devr-i Kebir',
  duyek: 'Düyek',
  kapali_curcuna: 'Kapalı Curcuna',
  nimsofyan: 'Nim Sofyan',
  senginsemai: 'Sengin Semai',
  turkaksagi: 'Türk Aksağı',
  yuruksemai: 'Yürük Semai',
  yuruksemai_ii: 'Yürük Semai II'
}

const MAKAM_ALIASES: Record<string, string> = {
  nihavend: 'nihavent'
}

const USUL_ALIASES: Record<string, string> = {
  'devr-i-hindi': 'devrihindi',
  'devr-i-kebir': 'devrikebir',
  'turk-aksagi': 'turkaksagi',
  'yuruk-semai': 'yuruksemai'
}

function titleCaseSegment(segment: string): string {
  if (segment.toLowerCase() === 'ii') return 'II'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

function humanizeId(id: string): string {
  return id
    .split('_')
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(' ')
}

export function normalizeMakamId(id: string): string {
  const value = id.trim().toLowerCase()
  return MAKAM_ALIASES[value] ?? value
}

export function normalizeUsulId(id: string): string {
  const value = id.trim().toLowerCase()
  return USUL_ALIASES[value] ?? value
}

export function getMakamDisplayName(id: string): string {
  const normalized = normalizeMakamId(id)
  return MAKAM_LABEL_OVERRIDES[normalized] ?? humanizeId(normalized)
}

export function getUsulDisplayName(id: string): string {
  const normalized = normalizeUsulId(id)
  return USUL_LABEL_OVERRIDES[normalized] ?? humanizeId(normalized)
}

export const DATASET_SUMMARY = dataset.source

export const MAKAM_OPTIONS: MakamOption[] = dataset.makams.map((makam) => ({
  ...makam,
  id: normalizeMakamId(makam.id),
  label: getMakamDisplayName(makam.id)
}))

export const USUL_OPTIONS = dataset.usuls.map((usul) => ({
  ...usul,
  id: normalizeUsulId(usul.id),
  label: getUsulDisplayName(usul.id)
}))
