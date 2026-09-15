import type { Question } from '../types/quiz'
import { concepts, type ConceptId } from './concepts'

export const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!
export const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
const n = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const decimal = (min: number, max: number, places = 1) => Number((min + Math.random() * (max - min)).toFixed(places))
const roundToSig = (value: number, significantFigures: number) => Number(value.toPrecision(significantFigures))
export const choice = (answer: string, wrong: string[]) => shuffle([answer, ...wrong]).map(v => ({ label: v, value: v }))
const qid = (concept: string) => `${concept}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const mcq = (conceptId: ConceptId, prompt: string, answer: string, wrong: string[], explanation: string, eyebrow = 'Choose one', hint?: string): Question => ({
  id: qid(conceptId), conceptId, topic: concepts.find(c => c[0] === conceptId)![1], eyebrow, prompt,
  choices: choice(answer, wrong), answer, explanation, hint,
})
const numeric = (conceptId: ConceptId, prompt: string, answer: number, unit: string, explanation: string, tolerance = Math.max(Math.abs(answer) * .015, .005), hint?: string): Question => ({
  id: qid(conceptId), conceptId, topic: concepts.find(c => c[0] === conceptId)![1], eyebrow: 'Type your answer', prompt, answer, unit, explanation, tolerance, hint,
})
const sci = (x: number, digits = 3) => x.toExponential(digits - 1).replace('e+', ' × 10^').replace('e-', ' × 10^−')
export const conversionFactors = [
  ['Length', '1 in = 2.54 cm', 'exact'],
  ['Length', '1 ft = 12 in', 'exact'],
  ['Length', '1 mi = 1.609 km', 'course precision'],
  ['Mass', '1 lb = 453.6 g', 'course precision'],
  ['Volume', '1 qt = 0.9464 L', 'course precision'],
  ['Volume', '1 mL = 1 cm³', 'exact'],
] as const

const generators: Record<ConceptId, () => Question> = {
  MEASUREMENT_READING: () => {
    const bank = [
      ['A graduated cylinder has marks every 1 mL. To what place should its volume be estimated?', 'nearest 0.1 mL', ['nearest 1 mL', 'nearest 0.01 mL', 'nearest 10 mL'], 'Record every certain digit plus one estimated digit beyond the smallest marking.'],
      ['A metric ruler has a smallest division of 0.1 cm. Which is an appropriately recorded length?', '12.34 cm', ['12 cm', '12.3 cm', '12.3456 cm'], 'A measurement includes the known tenths digit and one estimated hundredths digit.'],
      ['Which statement about a recorded measurement is correct?', 'Its final reported digit is uncertain.', ['Every digit is exact.', 'Only leading zeros are uncertain.', 'The unit determines the uncertainty.'], 'Measured values contain certain digits followed by one estimated, uncertain digit.'],
    ]
    const x = pick(bank)
    return mcq('MEASUREMENT_READING', x[0], x[1], x[2] as string[], x[3], 'Read the instrument')
  },
  ACCURACY_PRECISION: () => {
    if (Math.random() < .45) {
      const accepted = decimal(20, 80, 1), measured = Number((accepted + decimal(-2.5, 2.5, 1)).toFixed(1))
      const answer = Math.abs(measured - accepted) / accepted * 100
      return numeric('ACCURACY_PRECISION', `An accepted value is ${accepted.toFixed(1)} g and the measured value is ${measured.toFixed(1)} g. Calculate the percent error.`, Number(answer.toPrecision(3)), '%', `Percent error = |measured − accepted| ÷ accepted × 100 = ${Number(answer.toPrecision(3))}%.`, Math.max(answer * .004, .005), 'Use the absolute difference; percent error describes accuracy.')
    }
    const bank = [
      ['Several measurements are tightly grouped but far from the accepted value. They are…', 'precise but not accurate', ['accurate but not precise', 'both accurate and precise', 'neither measurable nor precise'], 'Precision is agreement among trials; accuracy is closeness to the accepted value.'],
      ['Which quantity describes the accuracy of a measured value?', 'percent error', ['average deviation', 'number of trials', 'measurement range only'], 'Percent error compares a measurement with an accepted value, so it describes accuracy.'],
      ['Which quantity is used in the course objectives to describe the precision of a set of measurements?', 'average deviation', ['percent error', 'density', 'mass percent'], 'Average deviation measures how closely repeated values agree with one another.'],
    ]
    const x = pick(bank)
    return mcq('ACCURACY_PRECISION', x[0], x[1], x[2] as string[], x[3], 'Accuracy or precision?')
  },
  ROUNDING: () => {
    const bank = [
      ['Round 0.006847 to 3 significant figures.', '0.00685', ['0.00684', '0.0068', '0.0068470'], 'The first three significant digits are 6, 8, and 4; the next digit is 7, so round 4 up.'],
      ['Round 73.956 to the tenths place.', '74.0', ['73.9', '73.96', '74'], 'The hundredths digit is 5, so 73.9 rounds to 74.0; the trailing decimal zero preserves the tenths place.'],
      ['Round 8,462 to 2 significant figures.', '8,500', ['8,400', '8,460', '8,462.0'], 'Keep 8 and 4; the next digit is 6, so round to 8,500.'],
    ]
    const x = pick(bank)
    const [prompt, correct, choices, explanation] = x as [string, string, string[], string]
    return mcq('ROUNDING', prompt, correct, choices, explanation, 'Report the requested precision')
  },
  SIGFIG_COUNT: () => {
    const samples = [
      ['0.00450', '3', ['2', '4', '5'], 'Leading zeros are placeholders; the 4, 5, and trailing zero are significant.'],
      ['80.020', '5', ['3', '4', '6'], 'Zeros between nonzero digits and trailing zeros after a decimal are significant.'],
      ['7002', '4', ['2', '3', '5'], 'Zeros trapped between nonzero digits are significant.'],
      ['0.03040', '4', ['2', '3', '5'], 'Ignore leading zeros; the interior and final decimal zeros count.'],
      ['6.00 × 10⁴', '3', ['1', '2', '4'], 'Only digits in the coefficient determine significant figures.'],
    ] as const
    const s = pick(samples)
    return mcq('SIGFIG_COUNT', `How many significant figures are in ${s[0]}?`, s[1], [...s[2]], s[3], 'Read the measurement')
  },
  SIGFIG_MULT_DIV: () => {
    const a = decimal(2.1, 9.9, 2), b = decimal(1.1, 4.9, 1), raw = a * b
    const answer = Number(raw.toPrecision(2))
    return numeric('SIGFIG_MULT_DIV', `Calculate ${a.toFixed(2)} × ${b.toFixed(1)}. Report the answer with the correct significant figures.`, answer, '', `The factor with the fewest significant figures has 2, so ${raw.toFixed(4)} rounds to ${answer}.`, Math.abs(answer) * .002, 'For multiplication, match the fewest significant figures—not decimal places.')
  },
  SIGFIG_ADD_SUB: () => {
    const a = decimal(12.11, 48.88, 2), b = decimal(1.1, 8.9, 1), raw = a + b, answer = Number(raw.toFixed(1))
    return numeric('SIGFIG_ADD_SUB', `Calculate ${a.toFixed(2)} + ${b.toFixed(1)}. Report the answer with the correct precision.`, answer, '', `Addition is limited by decimal places. ${raw.toFixed(2)} rounds to the tenths place: ${answer.toFixed(1)}.`, .025, 'For addition, line up decimal places and round to the least precise place.')
  },
  SIGFIG_MULTISTEP: () => {
    if (Math.random() < .5) {
      const a = decimal(2.1, 7.9, 2), b = decimal(1.05, 4.95, 2), c = decimal(2.1, 8.9, 1)
      const raw = a * b * c, answer = Number(raw.toPrecision(2))
      return numeric('SIGFIG_MULTISTEP', `Calculate ${a.toFixed(2)} × ${b.toFixed(2)} × ${c.toFixed(1)} with correct significant figures.`, answer, '', `Keep the full calculator result (${raw}) until the end, then round once to 2 significant figures: ${answer}.`, Math.max(Math.abs(answer) * .002, .001), 'Do not round intermediate results; the least precise factor has 2 significant figures.')
    }
    const a = decimal(3.1, 8.9, 3), b = decimal(1.1, 3.9, 2), c = decimal(1.1, 4.9, 1)
    const difference = a - b
    const raw = difference * c
    const answer = Number(raw.toPrecision(2))
    return numeric('SIGFIG_MULTISTEP', `Evaluate (${a.toFixed(3)} − ${b.toFixed(2)}) × ${c.toFixed(1)} and report the final answer correctly.`, answer, '', `The subtraction is limited to hundredths, but retain guard digits. Multiply the unrounded difference (${difference.toFixed(3)}) by ${c.toFixed(1)}, then round the final result to 2 significant figures: ${answer}.`, Math.max(Math.abs(answer) * .002, .001), 'Apply the subtraction decimal-place rule first, but round only the final result.')
  },
  SCIENTIFIC_NOTATION: () => {
    const kind = n(0, 3)
    if (kind === 0) {
      const coefficient = decimal(1.1, 9.8, 2), exponent = pick([-6, -5, -4, 4, 5, 6])
      const value = coefficient * 10 ** exponent
      return numeric('SCIENTIFIC_NOTATION', `Write ${coefficient.toFixed(2)} × 10${exponent < 0 ? '⁻' : ''}${Math.abs(exponent)} as an ordinary decimal.`, value, '', `Move the decimal ${Math.abs(exponent)} places ${exponent < 0 ? 'left' : 'right'}.`, Math.abs(value) * .001, 'A negative exponent makes a small number; a positive exponent makes a large one.')
    }
    if (kind === 1) return mcq('SCIENTIFIC_NOTATION', 'Which expression is in proper scientific notation?', '4.82 × 10⁵', ['48.2 × 10⁴', '0.482 × 10⁶', '482 × 10³'], 'Proper scientific notation has exactly one nonzero digit before the decimal.', 'Choose one')
    if (kind === 2) return mcq('SCIENTIFIC_NOTATION', 'Before adding 3.2 × 10⁴ and 6.15 × 10³, what must you do?', 'Rewrite them with the same power of ten.', ['Add the exponents.', 'Multiply the coefficients.', 'Discard the smaller number.'], 'Terms can be added only after their powers of ten match; then apply the decimal-place rule to the coefficients.', 'Adding in scientific notation')
    return mcq('SCIENTIFIC_NOTATION', 'What is (2.0 × 10³)(3.00 × 10⁻²) with correct significant figures?', '6.0 × 10¹', ['6.00 × 10¹', '6.0 × 10⁵', '5.0 × 10¹'], 'Multiply coefficients, add exponents, then round to the fewest significant figures: 2.', 'Calculate with powers of ten')
  },
  METRIC_PREFIX: () => {
    if (Math.random() < .25) {
      const x = pick([
        ['length', 'meter (m)', ['liter (L)', 'gram (g)', 'second (s)']],
        ['mass', 'gram (g)', ['meter (m)', 'liter (L)', 'kelvin (K)']],
        ['volume', 'liter (L)', ['gram (g)', 'mole (mol)', 'meter (m)']],
        ['temperature', 'kelvin (K)', ['degree Celsius (°C)', 'joule (J)', 'pascal (Pa)']],
      ])
      return mcq('METRIC_PREFIX', `Which basic course reference-table unit is listed for ${x[0]}?`, x[1] as string, x[2] as string[], `The selected-units table pairs ${x[0]} with ${x[1]}.`, 'Know the base units')
    }
    const items = [
      ['3.50 m', 'centimeters', 350, 'cm', '1 m = 100 cm, so multiply by 100.'],
      ['4.20 mg', 'grams', .0042, 'g', '1 mg = 10⁻³ g, so move the decimal three places left.'],
      ['0.075 L', 'milliliters', 75, 'mL', '1 L = 1000 mL.'],
      ['2.40 μm', 'meters', .0000024, 'm', 'Micro means 10⁻⁶.'],
      ['6.8 km', 'meters', 6800, 'm', 'Kilo means 10³.'],
    ] as const
    const x = pick(items)
    return numeric('METRIC_PREFIX', `Convert ${x[0]} to ${x[1]}.`, x[2], x[3], x[4], Math.max(Math.abs(x[2]) * .002, 1e-10), 'Write the prefix as a power of ten, then cancel units.')
  },
  DIMENSIONAL_ANALYSIS: () => {
    const kind = n(0, 6)
    if (kind === 0) {
      const miles = decimal(2, 9.9, 2), milesLabel = miles.toFixed(2), raw = miles * 1.609, answer = roundToSig(raw, 3)
      return numeric('DIMENSIONAL_ANALYSIS', `A route is ${milesLabel} miles long. Convert it to kilometers. (1 mi = 1.609 km)`, answer, 'km', `Set up ${milesLabel} mi × (1.609 km / 1 mi). Miles cancel. The measurement has 3 significant figures and the conversion has 4, so ${raw} rounds to ${answer} km.`, Math.abs(answer) * .001, 'Put miles in the denominator so the starting unit cancels.')
    }
    if (kind === 1) {
      const inches = decimal(10, 40, 1), inchesLabel = inches.toFixed(1), raw = inches * 2.54, answer = roundToSig(raw, 3)
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${inchesLabel} inches to centimeters. (1 in = 2.54 cm exactly)`, answer, 'cm', `${inchesLabel} in × (2.54 cm / 1 in) = ${answer} cm. The input has 3 significant figures; the defined conversion is exact and does not limit the result.`, Math.abs(answer) * .001, 'Arrange the factor so inches cancel.')
    }
    if (kind === 2) {
      let cm2 = n(121, 898)
      while (String(cm2).includes('0')) cm2 = n(121, 898)
      const raw = cm2 * (1 / 100) ** 2, answer = roundToSig(raw, 3)
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${cm2} cm² to m².`, answer, 'm²', `${cm2} cm² × (1 m / 100 cm)² = ${answer} m². The input has 3 significant figures; the exact metric factor is squared and does not limit the result.`, Math.abs(answer) * .001, 'For area, square both the unit and its conversion factor.')
    }
    if (kind === 3) {
      const pounds = decimal(10, 18, 2), poundsLabel = pounds.toFixed(2), raw = pounds * 453.6, answer = roundToSig(raw, 4)
      return numeric('DIMENSIONAL_ANALYSIS', `A sample has a mass of ${poundsLabel} lb. Convert it to grams.`, answer, 'g', `${poundsLabel} lb × (453.6 g / 1 lb) = ${answer} g. Both non-exact values have 4 significant figures.`, Math.abs(answer) * .001, 'Use 1 lb = 453.6 g from Tools and arrange it so lb cancels.')
    }
    if (kind === 4) {
      const liters = decimal(10, 12, 2), litersLabel = liters.toFixed(2), raw = liters / .9464, answer = roundToSig(raw, 4)
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${litersLabel} L to quarts.`, answer, 'qt', `${litersLabel} L × (1 qt / 0.9464 L) = ${raw}. Both non-exact values have 4 significant figures, so the result is ${answer} qt.`, Math.abs(answer) * .001, 'Use 1 qt = 0.9464 L and put liters in the denominator.')
    }
    if (kind === 5) {
      const feet = decimal(10, 15, 1), feetLabel = feet.toFixed(1), raw = feet * 12 * 2.54, answer = roundToSig(raw, 3)
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${feetLabel} ft to centimeters using two conversion factors.`, answer, 'cm', `${feetLabel} ft × (12 in / 1 ft) × (2.54 cm / 1 in) = ${answer} cm. The input has 3 significant figures; both defined conversion factors are exact.`, Math.abs(answer) * .001, 'Build a chain: feet → inches → centimeters.')
    }
    if (kind === 6) {
      const ml = decimal(12, 95, 1), mlLabel = ml.toFixed(1)
      return numeric('DIMENSIONAL_ANALYSIS', `A liquid occupies ${mlLabel} mL. Express this volume in cm³.`, ml, 'cm³', `The course relationship 1 mL = 1 cm³ is exact, so the ${mlLabel} measurement keeps its 3 significant figures and becomes ${mlLabel} cm³.`, .001, 'Use 1 mL = 1 cm³.')
    }
    throw new Error('Unknown conversion type')
  },
  DENSITY: () => {
    const type = n(0, 4), mass = decimal(15, 95, 1), volume = decimal(5, 30, 1)
    if (type === 0) return numeric('DENSITY', `A sample has a mass of ${mass} g and a volume of ${volume} mL. What is its density?`, Number((mass / volume).toPrecision(3)), 'g/mL', `Density = mass ÷ volume = ${mass} g ÷ ${volume} mL.`, mass / volume * .004, 'D = m/V')
    const density = decimal(1.2, 8.8, 2)
    if (type === 1) return numeric('DENSITY', `A liquid has density ${density} g/mL and volume ${volume} mL. What is its mass?`, Number((density * volume).toPrecision(3)), 'g', `Rearrange D = m/V to m = D × V.`, density * volume * .004, 'Cover mass in the density triangle: multiply density by volume.')
    if (type === 2) return numeric('DENSITY', `A ${mass} g metal has density ${density} g/cm³. What volume does it occupy?`, Number((mass / density).toPrecision(3)), 'cm³', 'Rearrange D = m/V to V = m/D.', mass / density * .004, 'Divide mass by density.')
    if (type === 3) return mcq('DENSITY', 'Object A and object B have equal volumes, but A has twice the mass of B. How do their densities compare?', 'A is twice as dense as B.', ['B is twice as dense as A.', 'They have equal density.', 'Density cannot be compared.'], 'For equal volumes, density changes in direct proportion to mass.', 'Reason with D = m/V')
    return mcq('DENSITY', 'A solid has density 0.92 g/mL and is placed in water at 25 °C (density about 1.00 g/mL). What happens?', 'It floats because it is less dense than water.', ['It sinks because it has mass.', 'It floats because it is more dense.', 'It dissolves because densities differ.'], 'An object less dense than the liquid floats. This also explains why ice floats in liquid water.', 'Compare object and liquid densities')
  },
  TEMPERATURE: () => {
    if (Math.random() > .5) {
      const c = n(-200, 400), k = c + 273
      return numeric('TEMPERATURE', `Using the course reference-table equation, convert ${c} °C to kelvin.`, k, 'K', `K = °C + 273 = ${c} + 273 = ${k} K.`, .01, 'Use K = °C + 273; kelvin has no degree symbol.')
    }
    const k = n(5, 700), c = k - 273
    return numeric('TEMPERATURE', `Convert ${k} K to degrees Celsius.`, c, '°C', `°C = K − 273 = ${k} − 273 = ${c} °C.`, .01, 'Rearrange K = °C + 273.')
  },
  MATTER_CLASSIFICATION: () => {
    const bank = [
      ['distilled water (H₂O)', 'compound', ['element', 'homogeneous mixture', 'heterogeneous mixture'], 'It has two elements chemically combined in a fixed ratio.'],
      ['copper wire made only of Cu', 'element', ['compound', 'homogeneous mixture', 'heterogeneous mixture'], 'It contains only one kind of atom.'],
      ['salt water with all salt dissolved', 'homogeneous mixture', ['element', 'compound', 'heterogeneous mixture'], 'Its composition is uniform, but the substances are not chemically bonded.'],
      ['oil and water in separate layers', 'heterogeneous mixture', ['element', 'compound', 'homogeneous mixture'], 'The composition is not uniform throughout.'],
      ['granite with visible mineral grains', 'heterogeneous mixture', ['element', 'compound', 'homogeneous mixture'], 'Its different components are visibly nonuniform.'],
    ]
    const x = pick(bank)
    return mcq('MATTER_CLASSIFICATION', `Classify ${x[0]}.`, x[1], x[2] as string[], x[3], 'Classify the sample')
  },
  PARTICLE_DIAGRAMS: () => {
    const bank: Array<[string[], string, string]> = [
      [['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'], 'pure substance — monatomic element', 'Every particle is the same single type of atom.'],
      [['AA', 'AA', 'AA', 'AA', 'AA', 'AA'], 'pure substance — diatomic element', 'All particles are identical molecules made from only one type of atom.'],
      [['AB', 'AB', 'AB', 'AB', 'AB', 'AB'], 'pure substance — compound', 'Every particle is the same, and each contains two different elements chemically joined.'],
      [['A', 'A', 'B', 'B', 'A', 'B', 'A', 'B'], 'mixture — elements only', 'Two different unbonded atom types are present, so this is a mixture of elements.'],
      [['AA', 'AA', 'AB', 'AB', 'AA', 'AB'], 'mixture — element and compound', 'The A₂ particles are an element; the AB particles are a compound. More than one particle type makes a mixture.'],
      [['AB', 'AB', 'AAB', 'AAB', 'AB', 'AAB'], 'mixture — compounds only', 'Both particle types contain different elements, but their formulas differ, so two compounds are mixed.'],
    ]
    const x = pick(bank)
    const q = mcq('PARTICLE_DIAGRAMS', 'Which description best classifies the sample shown?', x[1], [
      'pure substance — compound', 'mixture — elements only', 'mixture — element and compound', 'pure substance — diatomic element', 'mixture — compounds only', 'pure substance — monatomic element',
    ].filter(v => v !== x[1]).sort(() => Math.random() - .5).slice(0, 3), x[2], 'Interpret the particle model', 'First count the different particle types. Then decide whether each particle contains one element or more than one.')
    q.diagram = { molecules: shuffle(x[0]), caption: 'Different colors represent different elements. Touching circles are bonded.' }
    return q
  },
  MIXTURE_SEPARATION: () => {
    const bank = [
      ['A mixture contains insoluble sand and salt water. What passes through filter paper?', 'salt water', ['sand only', 'salt only', 'sand and salt'], 'The insoluble sand is trapped; dissolved salt and water pass through as the filtrate.'],
      ['Which method can recover dissolved salt from salt water?', 'evaporation', ['filtration', 'density determination', 'magnetic separation'], 'Evaporating the water leaves the nonvolatile dissolved salt behind.'],
      ['Which mixture is appropriately separated by filtration?', 'water and insoluble chalk', ['salt dissolved in water', 'two dissolved salts', 'ethanol dissolved in water'], 'Filtration separates an insoluble solid from a liquid.'],
    ]
    const x = pick(bank)
    return mcq('MIXTURE_SEPARATION', x[0], x[1], x[2] as string[], x[3], 'Choose a physical separation')
  },
  PHYSICAL_CHEMICAL: () => {
    const bank = [
      ['Iron rusts in moist air.', 'chemical change', ['physical change', 'physical property', 'chemical property'], 'Rust is a new substance with a different composition.'],
      ['Ethanol boils at 78 °C.', 'physical property', ['chemical property', 'physical change', 'chemical change'], 'Boiling point can be observed without changing chemical identity.'],
      ['A sheet of aluminum is cut into strips.', 'physical change', ['chemical change', 'physical property', 'chemical property'], 'Size and shape change, but composition does not.'],
      ['Gasoline is flammable.', 'chemical property', ['physical property', 'physical change', 'chemical change'], 'Flammability describes the ability to undergo a chemical reaction.'],
    ]
    const x = pick(bank)
    return mcq('PHYSICAL_CHEMICAL', `How should this be classified? “${x[0]}”`, x[1], x[2] as string[], x[3], 'Property or change?')
  },
  STATES_OF_MATTER: () => {
    const bank = [
      ['definite volume but no definite shape', 'liquid', ['solid', 'gas', 'both solid and gas'], 'A liquid takes its container’s shape but keeps nearly constant volume.'],
      ['definite shape and definite volume', 'solid', ['liquid', 'gas', 'both liquid and gas'], 'Particles in a solid occupy fixed positions.'],
      ['neither definite shape nor definite volume', 'gas', ['solid', 'liquid', 'both solid and liquid'], 'A gas expands to fill its container.'],
    ]
    const x = pick(bank)
    return mcq('STATES_OF_MATTER', `Which state of matter has ${x[0]}?`, x[1], x[2] as string[], x[3], 'Particle behavior')
  },
  STATE_TRANSITIONS: () => {
    const bank = [
      ['solid → liquid', 'melting; endothermic', ['freezing; exothermic', 'deposition; exothermic', 'condensation; endothermic'], 'Melting absorbs energy as a solid becomes a liquid.'],
      ['gas → liquid', 'condensation; exothermic', ['vaporization; endothermic', 'sublimation; endothermic', 'melting; exothermic'], 'Condensation releases energy as gas particles enter the liquid state.'],
      ['solid → gas', 'sublimation; endothermic', ['deposition; exothermic', 'freezing; endothermic', 'condensation; exothermic'], 'Sublimation absorbs energy and skips the liquid state.'],
      ['gas → solid', 'deposition; exothermic', ['sublimation; endothermic', 'condensation; endothermic', 'freezing; endothermic'], 'Deposition releases energy and skips the liquid state.'],
      ['liquid → solid', 'freezing; exothermic', ['melting; endothermic', 'vaporization; exothermic', 'sublimation; endothermic'], 'Freezing releases energy as particles become fixed in a solid.'],
      ['liquid → gas', 'vaporization; endothermic', ['condensation; exothermic', 'deposition; exothermic', 'freezing; endothermic'], 'Vaporization absorbs energy as a liquid becomes a gas.'],
    ]
    const x = pick(bank)
    return mcq('STATE_TRANSITIONS', `Identify the phase change and energy direction for ${x[0]}.`, x[1], x[2] as string[], x[3], 'Follow the phase change')
  },
  CONSERVATION_MASS: () => {
    const kind = n(0, 1)
    if (kind === 0) {
      const a = decimal(5, 20, 1), b = decimal(5, 20, 1), product = a + b
      return numeric('CONSERVATION_MASS', `In a closed container, ${a.toFixed(1)} g of A reacts completely with ${b.toFixed(1)} g of B to form one product. What mass of product forms?`, product, 'g', `In a closed system, total reactant mass equals total product mass: ${a.toFixed(1)} + ${b.toFixed(1)} = ${product.toFixed(1)} g.`, .01, 'Matter is rearranged, not created or destroyed.')
    }
    return mcq('CONSERVATION_MASS', 'A reaction in a sealed flask changes the substances present. What happens to the total mass?', 'It remains constant.', ['It always increases.', 'It always decreases.', 'It becomes zero.'], 'The law of conservation of mass applies because matter cannot enter or leave the closed flask.', 'Apply the conservation law')
  },
  ELEMENT_SYMBOLS: () => {
    const bank = [
      ['sodium', 'Na', ['S', 'So', 'N'], 'The chemical symbol for sodium is Na.'], ['potassium', 'K', ['P', 'Po', 'Pt'], 'The chemical symbol for potassium is K.'],
      ['iron', 'Fe', ['Ir', 'I', 'In'], 'The chemical symbol for iron is Fe.'], ['mercury', 'Hg', ['Mc', 'Mg', 'Mn'], 'The chemical symbol for mercury is Hg.'],
      ['silver', 'Ag', ['Si', 'S', 'Au'], 'The chemical symbol for silver is Ag.'], ['tin', 'Sn', ['Ti', 'Tn', 'Ta'], 'The chemical symbol for tin is Sn.'],
      ['copper', 'Cu', ['Co', 'C', 'Cr'], 'The chemical symbol for copper is Cu.'], ['lead', 'Pb', ['L', 'Ld', 'Li'], 'The chemical symbol for lead is Pb.'],
    ]
    const x = pick(bank)
    return mcq('ELEMENT_SYMBOLS', `What is the symbol for ${x[0]}?`, x[1], x[2] as string[], x[3], 'Element name → symbol')
  },
  ATOMIC_SCIENTISTS: () => {
    const bank = [
      ['The cathode-ray experiment revealed a negatively charged particle present in all atoms.', 'J. J. Thomson', ['Ernest Rutherford', 'John Dalton', 'Democritus'], 'Thomson used cathode rays to discover the electron.'],
      ['Most alpha particles passed through gold foil, but a few were sharply deflected.', 'Ernest Rutherford', ['J. J. Thomson', 'John Dalton', 'Democritus'], 'Rutherford concluded that atoms are mostly empty space with a tiny, dense, positive nucleus.'],
      ['Matter is composed of tiny, indivisible particles called atomos—an idea offered without experimental evidence.', 'Democritus', ['John Dalton', 'J. J. Thomson', 'Ernest Rutherford'], 'Democritus proposed the early philosophical idea of atomos but did not support it experimentally.'],
      ['Evidence that cathode rays bend toward a positive plate supports which conclusion?', 'Cathode rays contain negatively charged particles.', ['Atoms are solid and indivisible.', 'The nucleus occupies most atomic volume.', 'Electrons are positively charged.'], 'Opposite charges attract, so deflection toward the positive plate showed that cathode-ray particles were negative.'],
      ['In the gold-foil experiment, most alpha particles passed straight through. What conclusion follows?', 'The atom is mostly empty space.', ['Positive charge fills the entire atom.', 'Electrons are inside the nucleus.', 'Atoms have no internal structure.'], 'Most particles encountered no concentrated matter or charge, showing that most atomic volume is empty.'],
      ['A small fraction of alpha particles were strongly deflected. What conclusion follows?', 'Positive charge and most mass occupy a tiny, dense nucleus.', ['The atom is a uniform positive sphere.', 'Electrons account for most atomic mass.', 'Atoms are indivisible solid spheres.'], 'Large deflections require a concentrated, positively charged, massive center.'],
      ['What was a key limitation of Thomson’s “plum-pudding” model?', 'It could not explain the large alpha-particle deflections.', ['It contained no electrons.', 'It predicted a dense nucleus.', 'It said atoms were always charged.'], 'Diffuse positive charge could not produce the rare, sharp deflections observed by Rutherford.'],
      ['What important limitation remained in Rutherford’s nuclear model?', 'It did not explain how electrons are arranged or remain stable outside the nucleus.', ['It denied the existence of a nucleus.', 'It placed positive charge throughout the atom.', 'It claimed atoms contain no empty space.'], 'Rutherford established the nucleus but did not provide a stable, detailed electron arrangement.'],
    ]
    const x = pick(bank)
    return mcq('ATOMIC_SCIENTISTS', x[0], x[1], x[2] as string[], x[3], 'Models, evidence, and limitations')
  },
  DALTON: () => {
    const bank = [
      ['Which statement is consistent with Dalton’s atomic theory?', 'Compounds form when atoms combine in simple whole-number ratios.', ['Atoms contain a dense positive nucleus.', 'Electrons occupy quantized energy levels.', 'Atoms can be created in ordinary chemical reactions.'], 'Dalton proposed fixed, simple whole-number ratios in compounds.'],
      ['Which Dalton postulate is now known to be inaccurate because isotopes exist?', 'All atoms of the same element have identical masses.', ['Atoms are rearranged in reactions.', 'Compounds have definite composition.', 'Matter is conserved in reactions.'], 'Isotopes of one element have the same protons but different neutron counts and masses.'],
      ['Which observation illustrates the law of multiple proportions?', 'Two elements form different compounds using small whole-number ratios of atoms.', ['A sealed reaction keeps the same total mass.', 'A pure compound always has fixed composition.', 'A mixture can be filtered.'], 'Multiple compounds of the same elements differ by simple whole-number combining ratios.'],
      ['In Dalton’s model, what happens to atoms during an ordinary chemical reaction?', 'They are separated, combined, or rearranged.', ['They are created from energy.', 'Their nuclei split apart.', 'They change into different elements.'], 'Dalton stated that chemical reactions rearrange atoms without creating or destroying them.'],
    ]
    const x = pick(bank)
    return mcq('DALTON', x[0], x[1], x[2] as string[], x[3], 'Dalton’s postulates and limits')
  },
  SUBATOMIC_PARTICLES: () => {
    const bank: Array<[string, string, string[], string]> = [
      ['Which particle is located outside the nucleus and has a −1 charge?', 'electron', ['proton', 'neutron', 'nucleon'], 'Electrons occupy the space outside the nucleus and carry negative charge.'],
      ['Which particle has approximately 1 amu of mass and a +1 charge?', 'proton', ['electron', 'neutron', 'nucleon'], 'Protons are positively charged nucleons with a relative mass near 1.'],
      ['Which two particles are called nucleons?', 'protons and neutrons', ['protons and electrons', 'neutrons and electrons', 'protons only'], 'Nucleons are the particles found in the nucleus.'],
      ['Which particle contributes about 1 amu but has no electric charge?', 'neutron', ['proton', 'electron', 'nucleon'], 'A neutron is neutral and has nearly the same mass as a proton.'],
    ]
    const x = pick(bank)
    return mcq('SUBATOMIC_PARTICLES', x[0], x[1], x[2], x[3], 'Inside the atom')
  },
  ISOTOPES: () => mcq('ISOTOPES', pick([
    'Two atoms have the same atomic number but different mass numbers. What must differ?',
    'Carbon-12 and carbon-14 differ in which subatomic particle?',
    'What changes between isotopes of the same element?',
  ]), 'number of neutrons', ['number of protons', 'nuclear charge', 'element symbol'], 'Isotopes are atoms of the same element (same protons) with different neutron counts.', 'Same element, different mass'),
  IONS: () => {
    const z = pick([['Na', 11, 1], ['Mg', 12, 2], ['Al', 13, 3], ['Cl', 17, -1], ['O', 8, -2]] as const)
    const electrons = z[1] - z[2]
    if (Math.random() < .6) return numeric('IONS', `How many electrons are in ${z[0]}${Math.abs(z[2]) === 1 ? '' : Math.abs(z[2])}${z[2] > 0 ? '⁺' : '⁻'}?`, electrons, 'electrons', `Electrons = protons − charge. ${z[1]} − (${z[2]}) = ${electrons}.`, .01, 'A positive ion lost electrons; a negative ion gained them.')
    return mcq('IONS', `An ion has ${z[1]} protons and ${electrons} electrons. What is its charge?`, `${z[2] > 0 ? '+' : '−'}${Math.abs(z[2])}`, [`${z[2] > 0 ? '−' : '+'}${Math.abs(z[2])}`, '0', `${z[2] > 0 ? '+' : '−'}${Math.abs(z[2]) + 1}`], `Charge = protons − electrons = ${z[1]} − ${electrons} = ${z[2] > 0 ? '+' : '−'}${Math.abs(z[2])}.`, 'Compare positive and negative particles')
  },
  ATOMIC_NOTATION: () => {
    const atoms = pick([['sodium-23', 11, 23], ['chlorine-37', 17, 37], ['carbon-14', 6, 14], ['calcium-40', 20, 40]] as const)
    const kind = n(0, 2)
    if (kind === 0) return numeric('ATOMIC_NOTATION', `${atoms[0]} has atomic number ${atoms[1]}. How many neutrons does it contain?`, atoms[2] - atoms[1], 'neutrons', `Neutrons = mass number − atomic number = ${atoms[2]} − ${atoms[1]} = ${atoms[2] - atoms[1]}.`, .01, 'Mass number = protons + neutrons.')
    if (kind === 1) return mcq('ATOMIC_NOTATION', `For ${atoms[0]}, which pair gives (protons, neutrons)?`, `(${atoms[1]}, ${atoms[2] - atoms[1]})`, [`(${atoms[2]}, ${atoms[1]})`, `(${atoms[2] - atoms[1]}, ${atoms[1]})`, `(${atoms[1]}, ${atoms[2]})`], 'Atomic number gives protons; subtract it from mass number to get neutrons.', 'Decode the isotope')
    return mcq('ATOMIC_NOTATION', `An atom has ${atoms[1]} protons and ${atoms[2] - atoms[1]} neutrons. Which mass number belongs at the upper left of its isotopic symbol?`, String(atoms[2]), [String(atoms[1]), String(atoms[2] - atoms[1]), String(atoms[2] + atoms[1])], `Mass number is protons + neutrons = ${atoms[1]} + ${atoms[2] - atoms[1]} = ${atoms[2]}.`, 'Build the isotope')
  },
  AVERAGE_ATOMIC_MASS: () => {
    const m1 = n(20, 80), m2 = m1 + 2, abundance = n(65, 90), answer = m1 * abundance / 100 + m2 * (100 - abundance) / 100
    if (Math.random() < .7) return numeric('AVERAGE_ATOMIC_MASS', `Element X has two isotopes: X-${m1} (${abundance.toFixed(1)}%) and X-${m2} (${(100 - abundance).toFixed(1)}%). Find its average atomic mass.`, Number(answer.toFixed(2)), 'amu', `Weighted average = (${m1} × ${(abundance / 100).toFixed(3)}) + (${m2} × ${((100 - abundance) / 100).toFixed(3)}) = ${answer.toFixed(2)} amu.`, .015, 'Convert each percent to a decimal, multiply by its isotope mass, then add.')
    return mcq('AVERAGE_ATOMIC_MASS', `Element Q has only Q-${m1} and Q-${m2}. Its average atomic mass is ${answer.toFixed(1)} amu. Which isotope is more abundant?`, `Q-${m1}`, [`Q-${m2}`, 'They must be equally abundant.', 'Abundance cannot be inferred.'], `The average lies closer to ${m1}, so Q-${m1} must be more abundant.`, 'Reason from the weighted average')
  },
  IONIC_NAMING: () => {
    const bank = [
      ['Na₂O', 'sodium oxide', ['disodium oxide', 'sodium oxygen', 'sodium dioxide'], 'Name the metal first, then change the nonmetal ending to -ide. Ionic compounds do not use prefixes.'],
      ['FeCl₃', 'iron(III) chloride', ['iron chloride', 'iron(II) chloride', 'iron trichloride'], 'Three Cl⁻ ions require Fe³⁺, so the transition-metal charge is shown as (III).'],
      ['Cu₂O', 'copper(I) oxide', ['copper(II) oxide', 'dicopper oxide', 'copper oxygen'], 'O²⁻ is balanced by two Cu⁺ ions, so copper is (I).'],
      ['Mg₃N₂', 'magnesium nitride', ['trimagnesium dinitride', 'magnesium nitrogen', 'magnesium(II) nitride'], 'Magnesium has a fixed charge, so no Roman numeral or prefixes are used.'],
      ['SnCl₄', 'tin(IV) chloride', ['tin(II) chloride', 'tin tetrachloride', 'stannous chloride'], 'Four Cl⁻ ions require Sn⁴⁺, shown as tin(IV).'],
    ]
    const x = pick(bank)
    return mcq('IONIC_NAMING', `What is the correct name for ${x[0]}?`, x[1], x[2] as string[], x[3], 'Name the compound')
  },
  POLYATOMIC_NAMING: () => {
    const bank = [
      ['Ca(NO₃)₂', 'calcium nitrate', ['calcium nitrite', 'calcium dinitrate', 'calcium nitrogen oxide'], 'The intact polyatomic ion NO₃⁻ is nitrate; ionic names do not use prefixes.'],
      ['K₂SO₃', 'potassium sulfite', ['potassium sulfate', 'dipotassium sulfite', 'potassium sulfur trioxide'], 'SO₃²⁻ is sulfite; potassium has a fixed +1 charge.'],
      ['Fe₂(SO₄)₃', 'iron(III) sulfate', ['iron(II) sulfate', 'diiron trisulfate', 'iron sulfite'], 'Three sulfate ions total −6, so two iron ions must each be +3.'],
      ['NH₄ClO₄', 'ammonium perchlorate', ['ammonia chlorate', 'ammonium chlorite', 'ammonium tetrachloride'], 'NH₄⁺ is ammonium and ClO₄⁻ is perchlorate.'],
      ['CuNO₃', 'copper(I) nitrate', ['copper(II) nitrate', 'copper nitrite', 'copper mononitrate'], 'One nitrate ion is −1, so copper must be +1.'],
    ]
    const x = pick(bank)
    return mcq('POLYATOMIC_NAMING', `What is the correct name for ${x[0]}?`, x[1], x[2] as string[], x[3], 'Recognize the polyatomic ion')
  },
  MOLECULAR_NAMING: () => {
    const bank = [
      ['N₂O₅', 'dinitrogen pentoxide', ['nitrogen oxide', 'nitrogen(V) oxide', 'dinitrogen pentaoxide'], 'Two nonmetals use prefixes: di- for 2 and pent- for 5; the vowel is dropped in pentoxide.'],
      ['CO₂', 'carbon dioxide', ['monocarbon dioxide', 'carbon oxide', 'carbon(II) oxide'], 'Omit mono- on the first element; use di- for two oxygens.'],
      ['PCl₃', 'phosphorus trichloride', ['phosphorus chloride', 'phosphorus(III) chloride', 'monophosphorus trichloride'], 'Molecular compounds use prefixes; the first element omits mono-.'],
      ['SF₆', 'sulfur hexafluoride', ['sulfur fluoride', 'sulfur(VI) fluoride', 'monosulfur hexafluoride'], 'Use hexa- for six fluorine atoms.'],
    ]
    const x = pick(bank)
    return mcq('MOLECULAR_NAMING', `Name the molecular compound ${x[0]}.`, x[1], x[2] as string[], x[3], 'Use prefixes')
  },
  FORMULA_WRITING: () => {
    const bank = [
      ['calcium chloride', 'CaCl₂', ['CaCl', 'Ca₂Cl', 'Ca₂Cl₂'], 'Ca²⁺ needs two Cl⁻ ions for a neutral formula.'],
      ['aluminum sulfide', 'Al₂S₃', ['AlS', 'Al₃S₂', 'Al₂(S₃)'], 'The smallest ratio balancing Al³⁺ and S²⁻ is 2:3.'],
      ['iron(III) oxide', 'Fe₂O₃', ['FeO', 'Fe₃O₂', 'FeO₃'], 'Two Fe³⁺ ions (+6) balance three O²⁻ ions (−6).'],
      ['calcium phosphate', 'Ca₃(PO₄)₂', ['CaPO₄', 'Ca₂(PO₄)₃', 'Ca₃PO₄₂'], 'Three Ca²⁺ ions balance two PO₄³⁻ ions; parentheses preserve the polyatomic ion.'],
      ['ammonium sulfate', '(NH₄)₂SO₄', ['NH₄SO₄', 'NH₄(SO₄)₂', '(NH₄)₂SO₃'], 'Two NH₄⁺ ions balance one SO₄²⁻ ion.'],
      ['dinitrogen pentoxide', 'N₂O₅', ['NO', 'N₅O₂', 'N₂O₄'], 'For molecular compounds, prefixes directly specify subscripts: di- is 2 and penta- is 5.'],
    ]
    const x = pick(bank)
    return mcq('FORMULA_WRITING', `Which formula represents ${x[0]}?`, x[1], x[2] as string[], x[3], 'Name → formula')
  },
  EMPIRICAL_MOLECULAR: () => {
    const bank = [
      ['C₆H₁₂O₆', 'CH₂O', ['C₆H₁₂O₆', 'C₃H₆O₃', 'CHO'], 'Divide every subscript by their greatest common factor, 6.'],
      ['N₂O₄', 'NO₂', ['N₂O₄', 'N₂O₂', 'NO'], 'Divide both subscripts by 2 to obtain the simplest whole-number ratio.'],
      ['P₄O₁₀', 'P₂O₅', ['PO₂', 'P₄O₅', 'PO₅'], 'The greatest common factor is 2, giving P₂O₅.'],
    ]
    if (Math.random() < .55) {
      const x = pick(bank)
      return mcq('EMPIRICAL_MOLECULAR', `What is the empirical formula of a compound with molecular formula ${x[0]}?`, x[1], x[2] as string[], x[3], 'Reduce to the simplest ratio')
    }
    const x = pick([['CH₂O', 3, 'C₃H₆O₃'], ['NO₂', 2, 'N₂O₄'], ['P₂O₅', 2, 'P₄O₁₀']] as const)
    return mcq('EMPIRICAL_MOLECULAR', `A compound has empirical formula ${x[0]}, and its molecular formula is ${x[1]} times the empirical formula. What is the molecular formula?`, x[2], [x[0], 'The subscripts cannot change.', 'C₂H₄O₂'], `Multiply every empirical-formula subscript by ${x[1]}.`, 'Scale every subscript equally')
  },
}

export function generateQuestion(conceptId: ConceptId): Question {
  return generators[conceptId]()
}
