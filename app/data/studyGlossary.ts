/**
 * Subject-agnostic glossary entries used to generate contrastive answer feedback.
 *
 * Future document importers should emit this shape alongside question templates.
 * `aliases` let answer text resolve to the canonical entry without coupling the
 * feedback UI to a particular course or question bank.
 */
export type GlossaryEntry = {
  id: string
  term: string
  definition: string
  aliases?: string[]
}

export const studyGlossary: GlossaryEntry[] = [
  { id: 'element', term: 'Element', definition: 'A pure substance containing only one type of atom. It cannot be broken down by ordinary chemical means.' },
  { id: 'compound', term: 'Compound', definition: 'A pure substance containing two or more elements chemically bonded in a fixed proportion.' },
  { id: 'homogeneous-mixture', term: 'Homogeneous mixture', definition: 'Two or more substances physically combined with a uniform composition throughout; the components are not chemically bonded.', aliases: ['solution', 'mixture — homogeneous'] },
  { id: 'heterogeneous-mixture', term: 'Heterogeneous mixture', definition: 'Two or more substances physically combined with a composition that is not uniform throughout.', aliases: ['mixture — heterogeneous'] },
  { id: 'pure-substance', term: 'Pure substance', definition: 'Matter with constant composition: either a single element or a single compound.' },
  { id: 'mixture', term: 'Mixture', definition: 'A physical combination of substances with variable composition that can be separated by physical means.' },
  { id: 'physical-property', term: 'Physical property', definition: 'A characteristic observed or measured without changing a substance’s chemical identity.' },
  { id: 'chemical-property', term: 'Chemical property', definition: 'A substance’s ability to undergo a reaction that produces different substances.' },
  { id: 'physical-change', term: 'Physical change', definition: 'A change in form, size, or state that does not create a substance with a new chemical identity.' },
  { id: 'chemical-change', term: 'Chemical change', definition: 'A change that rearranges atoms and produces one or more substances with new chemical identities.' },
  { id: 'solid', term: 'Solid', definition: 'A state of matter with definite shape and definite volume; its particles occupy fixed positions.' },
  { id: 'liquid', term: 'Liquid', definition: 'A state of matter with definite volume but no definite shape; it takes the shape of its container.' },
  { id: 'gas', term: 'Gas', definition: 'A state of matter with neither definite shape nor definite volume; it expands to fill its container.' },
  { id: 'melting', term: 'Melting', definition: 'The endothermic physical change from solid to liquid.' },
  { id: 'freezing', term: 'Freezing', definition: 'The exothermic physical change from liquid to solid.' },
  { id: 'vaporization', term: 'Vaporization', definition: 'The endothermic physical change from liquid to gas.' },
  { id: 'condensation', term: 'Condensation', definition: 'The exothermic physical change from gas to liquid.' },
  { id: 'sublimation', term: 'Sublimation', definition: 'The endothermic physical change from solid directly to gas.' },
  { id: 'deposition', term: 'Deposition', definition: 'The exothermic physical change from gas directly to solid.' },
  { id: 'accuracy', term: 'Accuracy', definition: 'How close a measured value is to an accepted value; percent error describes accuracy.' },
  { id: 'precision', term: 'Precision', definition: 'How closely repeated measurements agree with one another; average deviation describes precision.' },
  { id: 'percent-error', term: 'Percent error', definition: 'The absolute difference between measured and accepted values, divided by the accepted value and multiplied by 100.' },
  { id: 'density', term: 'Density', definition: 'Mass per unit volume, calculated as d = m/V.' },
  { id: 'proton', term: 'Proton', definition: 'A +1 particle in the nucleus with a relative mass of about 1 amu.' },
  { id: 'neutron', term: 'Neutron', definition: 'A neutral particle in the nucleus with a relative mass of about 1 amu.' },
  { id: 'electron', term: 'Electron', definition: 'A −1 particle outside the nucleus with very little mass compared with a proton or neutron.' },
  { id: 'nucleon', term: 'Nucleon', definition: 'The general name for either a proton or a neutron because both are found in the nucleus.', aliases: ['nucleons'] },
  { id: 'atomic-number', term: 'Atomic number', definition: 'The number of protons in an atom’s nucleus; it determines the element’s identity.' },
  { id: 'mass-number', term: 'Mass number', definition: 'The total number of protons and neutrons in a particular isotope.' },
  { id: 'isotope', term: 'Isotope', definition: 'An atom of the same element with the same proton count but a different neutron count and mass number.', aliases: ['isotopes'] },
  { id: 'ion', term: 'Ion', definition: 'A charged particle formed when an atom gains or loses electrons; its proton count does not change.', aliases: ['ions'] },
  { id: 'cation', term: 'Cation', definition: 'A positively charged ion with fewer electrons than protons.', aliases: ['positive ion'] },
  { id: 'anion', term: 'Anion', definition: 'A negatively charged ion with more electrons than protons.', aliases: ['negative ion'] },
  { id: 'average-atomic-mass', term: 'Average atomic mass', definition: 'The weighted average mass of an element’s naturally occurring isotopes.' },
  { id: 'ionic-compound', term: 'Ionic compound', definition: 'A neutral compound made from cations and anions; prefixes are not used in its standard name.' },
  { id: 'molecular-compound', term: 'Molecular compound', definition: 'A compound usually formed between nonmetals and named with prefixes that indicate atom counts.', aliases: ['covalent compound'] },
  { id: 'empirical-formula', term: 'Empirical formula', definition: 'The simplest whole-number ratio of atoms of each element in a compound.' },
  { id: 'molecular-formula', term: 'Molecular formula', definition: 'The actual number of atoms of each element in a molecule; it is a whole-number multiple of the empirical formula.' },
  { id: 'filtration', term: 'Filtration', definition: 'A physical separation that traps an insoluble solid while a liquid and dissolved substances pass through.' },
  { id: 'evaporation', term: 'Evaporation', definition: 'A physical separation that removes a volatile liquid and leaves a dissolved nonvolatile solid behind.' },
]

const normalize = (value: string) => value.toLowerCase().trim().replace(/[.;:]$/, '')

export function findGlossaryEntry(value: unknown): GlossaryEntry | undefined {
  if (typeof value !== 'string') return undefined
  const target = normalize(value)
  return studyGlossary.find(entry => {
    const labels = [entry.term, entry.id.replaceAll('-', ' '), ...(entry.aliases || [])].map(normalize)
    return labels.some(label => target === label || target.includes(label))
  })
}
