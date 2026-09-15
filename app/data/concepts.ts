import type { MasteryMap } from '../types/quiz'

export const concepts = [
  ['MEASUREMENT_READING', 'Measurement & uncertainty', 'Measurement'],
  ['ACCURACY_PRECISION', 'Accuracy & precision', 'Measurement'],
  ['ROUNDING', 'Rounding measurements', 'Measurement'],
  ['SIGFIG_COUNT', 'Counting sig figs', 'Measurement'],
  ['SIGFIG_MULT_DIV', 'Sig figs: × and ÷', 'Measurement'],
  ['SIGFIG_ADD_SUB', 'Sig figs: + and −', 'Measurement'],
  ['SIGFIG_MULTISTEP', 'Multistep sig figs', 'Measurement'],
  ['SCIENTIFIC_NOTATION', 'Scientific notation', 'Measurement'],
  ['METRIC_PREFIX', 'Metric prefixes', 'Conversions'],
  ['DIMENSIONAL_ANALYSIS', 'Dimensional analysis', 'Conversions'],
  ['DENSITY', 'Density', 'Conversions'],
  ['TEMPERATURE', 'Temperature', 'Conversions'],
  ['MATTER_CLASSIFICATION', 'Classifying matter', 'Matter'],
  ['PARTICLE_DIAGRAMS', 'Particle diagrams', 'Matter'],
  ['MIXTURE_SEPARATION', 'Separating mixtures', 'Matter'],
  ['PHYSICAL_CHEMICAL', 'Properties & changes', 'Matter'],
  ['STATES_OF_MATTER', 'States of matter', 'Matter'],
  ['STATE_TRANSITIONS', 'State transitions', 'Matter'],
  ['CONSERVATION_MASS', 'Conservation of mass', 'Matter'],
  ['ELEMENT_SYMBOLS', 'Element names & symbols', 'Matter'],
  ['ATOMIC_SCIENTISTS', 'Atomic model scientists', 'Atomic theory'],
  ['DALTON', "Dalton's theory", 'Atomic theory'],
  ['SUBATOMIC_PARTICLES', 'Subatomic particles', 'Atomic structure'],
  ['ISOTOPES', 'Isotopes', 'Atomic structure'],
  ['IONS', 'Ions', 'Atomic structure'],
  ['ATOMIC_NOTATION', 'Atomic notation', 'Atomic structure'],
  ['AVERAGE_ATOMIC_MASS', 'Average atomic mass', 'Atomic structure'],
  ['IONIC_NAMING', 'Ionic naming', 'Nomenclature'],
  ['POLYATOMIC_NAMING', 'Polyatomic compounds', 'Nomenclature'],
  ['MOLECULAR_NAMING', 'Molecular naming', 'Nomenclature'],
  ['FORMULA_WRITING', 'Writing formulas', 'Nomenclature'],
  ['EMPIRICAL_MOLECULAR', 'Empirical & molecular formulas', 'Nomenclature'],
] as const

export type ConceptId = typeof concepts[number][0]
export const freshMastery = (): MasteryMap => Object.fromEntries(concepts.map(([id]) => [id, { score: 0, correct: 0, wrong: 0 }]))

