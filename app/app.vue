<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { findGlossaryEntry } from './data/studyGlossary'

type Mode = 'learn' | 'exam' | 'weak' | 'grind'
type Choice = { label: string; value: string }
type ParticleDiagram = { molecules: string[]; caption?: string }
type AttemptRecord = { question: Question; attempts: number; firstCorrect: boolean; solved: boolean }
type Question = {
  id: string
  conceptId: string
  topic: string
  eyebrow: string
  prompt: string
  choices?: Choice[]
  answer: string | number
  tolerance?: number
  unit?: string
  explanation: string
  hint?: string
  diagram?: ParticleDiagram
}

const concepts = [
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

type ConceptId = typeof concepts[number][0]
type MasteryMap = Record<string, { score: number; correct: number; wrong: number }>
const freshMastery = (): MasteryMap => Object.fromEntries(concepts.map(([id]) => [id, { score: 0, correct: 0, wrong: 0 }]))

const mode = ref<Mode>('learn')
const screen = ref<'home' | 'quiz' | 'summary'>('home')
const mastery = ref<MasteryMap>(freshMastery())
const stats = ref({ attempted: 0, correct: 0, streak: 0, bestStreak: 0 })
const current = ref<Question | null>(null)
const response = ref('')
const submitted = ref(false)
const wasCorrect = ref(false)
const examQuestions = ref<Question[]>([])
const examIndex = ref(0)
const sessionRecords = ref<AttemptRecord[]>([])
const resumeAvailable = ref(false)
const recentIds = ref<string[]>([])
const showHint = ref(false)
const showTools = ref(false)
const answerInput = ref<HTMLInputElement | null>(null)

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
const n = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const decimal = (min: number, max: number, places = 1) => Number((min + Math.random() * (max - min)).toFixed(places))
const choice = (answer: string, wrong: string[]) => shuffle([answer, ...wrong]).map(v => ({ label: v, value: v }))
const qid = (concept: string) => `${concept}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const mcq = (conceptId: ConceptId, prompt: string, answer: string, wrong: string[], explanation: string, eyebrow = 'Choose one', hint?: string): Question => ({
  id: qid(conceptId), conceptId, topic: concepts.find(c => c[0] === conceptId)![1], eyebrow, prompt,
  choices: choice(answer, wrong), answer, explanation, hint,
})
const numeric = (conceptId: ConceptId, prompt: string, answer: number, unit: string, explanation: string, tolerance = Math.max(Math.abs(answer) * .015, .005), hint?: string): Question => ({
  id: qid(conceptId), conceptId, topic: concepts.find(c => c[0] === conceptId)![1], eyebrow: 'Type your answer', prompt, answer, unit, explanation, tolerance, hint,
})
const sci = (x: number, digits = 3) => x.toExponential(digits - 1).replace('e+', ' × 10^').replace('e-', ' × 10^−')
const conversionFactors = [
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
    return mcq('ROUNDING', x[0], x[1], x[2] as string[], x[3], 'Report the requested precision')
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
      const miles = decimal(2, 12, 1), answer = miles * 1.609
      return numeric('DIMENSIONAL_ANALYSIS', `A route is ${miles} miles long. Convert it to kilometers. (1 mi = 1.609 km)`, Number(answer.toPrecision(4)), 'km', `Set up ${miles} mi × (1.609 km / 1 mi). Miles cancel, giving ${Number(answer.toPrecision(4))} km.`, answer * .002, 'Put miles in the denominator so the starting unit cancels.')
    }
    if (kind === 1) {
      const inches = decimal(8, 40, 1), answer = inches * 2.54
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${inches} inches to centimeters. (1 in = 2.54 cm exactly)`, Number(answer.toPrecision(3)), 'cm', `${inches} in × (2.54 cm / 1 in) = ${Number(answer.toPrecision(3))} cm. The defined conversion does not limit significant figures.`, answer * .002, 'Arrange the factor so inches cancel.')
    }
    if (kind === 2) {
      const cm2 = n(120, 850), answer = cm2 * (1 / 100) ** 2
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${cm2} cm² to m².`, Number(answer.toPrecision(3)), 'm²', `${cm2} cm² × (1 m / 100 cm)² = ${Number(answer.toPrecision(3))} m². The conversion factor must be squared.`, answer * .002, 'For area, square both the unit and its conversion factor.')
    }
    if (kind === 3) {
      const pounds = decimal(1.5, 18, 2), answer = pounds * 453.6
      return numeric('DIMENSIONAL_ANALYSIS', `A sample has a mass of ${pounds.toFixed(2)} lb. Convert it to grams.`, Number(answer.toPrecision(4)), 'g', `${pounds.toFixed(2)} lb × (453.6 g / 1 lb) = ${Number(answer.toPrecision(4))} g. Pounds cancel.`, answer * .002, 'Use 1 lb = 453.6 g from Tools and arrange it so lb cancels.')
    }
    if (kind === 4) {
      const liters = decimal(1.5, 12, 2), answer = liters / .9464
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${liters.toFixed(2)} L to quarts.`, Number(answer.toPrecision(3)), 'qt', `${liters.toFixed(2)} L × (1 qt / 0.9464 L) = ${Number(answer.toPrecision(3))} qt.`, answer * .002, 'Use 1 qt = 0.9464 L and put liters in the denominator.')
    }
    if (kind === 5) {
      const feet = decimal(2, 15, 1), answer = feet * 12 * 2.54
      return numeric('DIMENSIONAL_ANALYSIS', `Convert ${feet.toFixed(1)} ft to centimeters using two conversion factors.`, Number(answer.toPrecision(3)), 'cm', `${feet.toFixed(1)} ft × (12 in / 1 ft) × (2.54 cm / 1 in) = ${Number(answer.toPrecision(3))} cm. Both ft and in cancel.`, answer * .002, 'Build a chain: feet → inches → centimeters.')
    }
    if (kind === 6) {
      const ml = decimal(12, 95, 1)
      return numeric('DIMENSIONAL_ANALYSIS', `A liquid occupies ${ml} mL. Express this volume in cm³.`, ml, 'cm³', `The course relationship is 1 mL = 1 cm³, so the numerical value remains ${ml}.`, .01, 'Use 1 mL = 1 cm³.')
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
    const bank = [
      ['Which particle is located outside the nucleus and has a −1 charge?', 'electron', ['proton', 'neutron', 'nucleon'], 'Electrons occupy the space outside the nucleus and carry negative charge.'],
      ['Which particle has approximately 1 amu of mass and a +1 charge?', 'proton', ['electron', 'neutron', 'nucleon'], 'Protons are positively charged nucleons with a relative mass near 1.'],
      ['Which two particles are called nucleons?', 'protons and neutrons', ['protons and electrons', 'neutrons and electrons', 'protons only'], 'Nucleons are the particles found in the nucleus.'],
      ['Which particle contributes about 1 amu but has no electric charge?', 'neutron', ['proton', 'electron', 'nucleon'], 'A neutron is neutral and has nearly the same mass as a proton.'],
    ]
    const x = pick(bank)
    return mcq('SUBATOMIC_PARTICLES', x[0], x[1], x[2] as string[], x[3], 'Inside the atom')
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

const topicGroups = computed(() => {
  const groups: Record<string, typeof concepts[number][]> = {}
  concepts.forEach(c => (groups[c[2]] ||= []).push(c))
  return groups
})
const masteryPercent = computed(() => Math.round(Object.values(mastery.value).reduce((sum, x) => sum + x.score, 0) / concepts.length))
const modeTitle = computed(() => ({ learn: 'Learn mode', exam: 'Practice test', weak: 'Weak topics', grind: 'Quick grind' })[mode.value])
const sessionTarget = computed(() => ({ learn: 25, exam: 50, weak: 20, grind: 0 })[mode.value])
const questionPosition = computed(() => mode.value === 'exam' ? examIndex.value + 1 : sessionRecords.value.length + (sessionRecords.value.some(r => r.question.id === current.value?.id) ? 0 : 1))
const progressText = computed(() => sessionTarget.value ? `${Math.min(questionPosition.value, sessionTarget.value)} / ${sessionTarget.value}` : `${sessionRecords.value.length} done`)
const firstTryCorrect = computed(() => sessionRecords.value.filter(r => r.firstCorrect).length)
const recoveredCount = computed(() => sessionRecords.value.filter(r => !r.firstCorrect && r.solved).length)
const sessionAccuracy = computed(() => sessionRecords.value.length ? Math.round(firstTryCorrect.value / sessionRecords.value.length * 100) : 0)
const currentAttempts = computed(() => sessionRecords.value.find(r => r.question.id === current.value?.id)?.attempts || 0)
const selectedDefinition = computed(() => findGlossaryEntry(response.value))
const correctDefinition = computed(() => findGlossaryEntry(current.value?.answer))

function generateFor(id: ConceptId) { return generators[id]() }
function weightedConcept(): ConceptId {
  let candidates = concepts
  if (mode.value === 'weak') {
    const weak = concepts.filter(([id]) => mastery.value[id].score < 67 || mastery.value[id].wrong > 0)
    if (weak.length) candidates = weak as typeof concepts
  }
  if (mode.value === 'grind') return pick(candidates)[0]
  const pool = candidates.flatMap(c => Array(Math.max(1, 6 - Math.floor(mastery.value[c[0]].score / 20))).fill(c[0]))
  return pick(pool) as ConceptId
}
function nextQuestion() {
  submitted.value = false
  response.value = ''
  showHint.value = false
  let q: Question
  let tries = 0
  do { q = generateFor(weightedConcept()); tries++ } while (recentIds.value.includes(q.conceptId) && tries < 5)
  current.value = q
  recentIds.value = [...recentIds.value.slice(-3), q.conceptId]
  nextTick(() => answerInput.value?.focus())
  persistSession()
}
function buildPracticeTest(count: number) {
  const ids: ConceptId[] = []
  while (ids.length < count) ids.push(...shuffle(concepts.map(c => c[0])))
  return ids.slice(0, count).map(generateFor)
}
function start(selected: Mode) {
  mode.value = selected
  screen.value = 'quiz'
  examIndex.value = 0
  sessionRecords.value = []
  if (selected === 'exam') {
    examQuestions.value = buildPracticeTest(50)
    current.value = examQuestions.value[0]
    submitted.value = false
    response.value = ''
    persistSession()
  } else nextQuestion()
}
function normalize(v: string) { return v.trim().toLowerCase().replace(/,/g, '') }
function check(q: Question, value: string) {
  if (typeof q.answer === 'number') {
    const parsed = Number(value.replace(/×\s*10\^?/i, 'e').replace(/\s/g, ''))
    return Number.isFinite(parsed) && Math.abs(parsed - q.answer) <= (q.tolerance ?? .001)
  }
  return normalize(value) === normalize(q.answer)
}
function submit() {
  if (!current.value || !response.value || submitted.value) return
  wasCorrect.value = check(current.value, response.value)
  submitted.value = true
  let record = sessionRecords.value.find(r => r.question.id === current.value!.id)
  const isFirstAttempt = !record
  if (!record) {
    record = { question: current.value, attempts: 0, firstCorrect: wasCorrect.value, solved: false }
    sessionRecords.value.push(record)
  }
  record.attempts++
  if (wasCorrect.value) record.solved = true

  // Only the first answer changes scored accuracy and mastery. Retries remain visible
  // in the session report without rewriting the student's original result.
  if (isFirstAttempt) {
    stats.value.attempted++
    const m = mastery.value[current.value.conceptId]
    if (wasCorrect.value) {
      stats.value.correct++
      stats.value.streak++
      stats.value.bestStreak = Math.max(stats.value.bestStreak, stats.value.streak)
      m.correct++
      m.score = Math.min(100, m.score + (m.score >= 67 ? 11 : 34))
    } else {
      stats.value.streak = 0
      m.wrong++
      m.score = Math.max(0, m.score - 25)
    }
  }
  persist()
  persistSession()
}
function retryQuestion() {
  submitted.value = false
  wasCorrect.value = false
  response.value = ''
  showHint.value = false
  nextTick(() => answerInput.value?.focus())
  persistSession()
}
function advanceQuestion() {
  if (sessionTarget.value && sessionRecords.value.length >= sessionTarget.value) return finishSession()
  if (mode.value === 'exam') {
    examIndex.value++
    current.value = examQuestions.value[examIndex.value]
    submitted.value = false
    response.value = ''
    showHint.value = false
    nextTick(() => answerInput.value?.focus())
    persistSession()
  } else nextQuestion()
}
function finishSession() {
  if (!sessionRecords.value.length) return goHome()
  persist()
  localStorage.removeItem('chem-grind-active-session')
  resumeAvailable.value = false
  screen.value = 'summary'
}
function resetProgress() {
  if (!confirm('Reset all mastery, streaks, and answer history?')) return
  mastery.value = freshMastery()
  stats.value = { attempted: 0, correct: 0, streak: 0, bestStreak: 0 }
  localStorage.removeItem('chem-grind-progress')
  localStorage.removeItem('chem-grind-active-session')
  resumeAvailable.value = false
}
function persist() {
  localStorage.setItem('chem-grind-progress', JSON.stringify({ mastery: mastery.value, stats: stats.value }))
}
function persistSession() {
  if (screen.value !== 'quiz' || !current.value) return
  localStorage.setItem('chem-grind-active-session', JSON.stringify({
    mode: mode.value, current: current.value, examQuestions: examQuestions.value,
    examIndex: examIndex.value, sessionRecords: sessionRecords.value,
    submitted: submitted.value, wasCorrect: wasCorrect.value, response: response.value,
  }))
  resumeAvailable.value = true
}
function resumeSession() {
  const saved = localStorage.getItem('chem-grind-active-session')
  if (!saved) return
  try {
    const data = JSON.parse(saved)
    mode.value = data.mode
    current.value = data.current
    examQuestions.value = data.examQuestions || []
    examIndex.value = data.examIndex || 0
    sessionRecords.value = data.sessionRecords || []
    submitted.value = Boolean(data.submitted)
    wasCorrect.value = Boolean(data.wasCorrect)
    response.value = data.response || ''
    screen.value = 'quiz'
    nextTick(() => answerInput.value?.focus())
  } catch {
    localStorage.removeItem('chem-grind-active-session')
    resumeAvailable.value = false
  }
}
function goHome() {
  persistSession()
  screen.value = 'home'
  current.value = null
}
function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && showTools.value) { showTools.value = false; return }
  if (showTools.value) return
  if (e.key === 'Enter' && screen.value === 'quiz') {
    if (submitted.value) wasCorrect.value ? advanceQuestion() : retryQuestion()
    else submit()
  }
}

onMounted(() => {
  const saved = localStorage.getItem('chem-grind-progress')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      mastery.value = { ...freshMastery(), ...data.mastery }
      stats.value = { ...stats.value, ...data.stats }
    } catch { /* ignore corrupted progress */ }
  }
  resumeAvailable.value = Boolean(localStorage.getItem('chem-grind-active-session'))
  window.addEventListener('keydown', handleKey)
})
watch(screen, persist)
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="brand" @click="goHome" aria-label="Go home">
        <span class="brand-mark">Q</span>
        <span>CHEM <b>GRIND</b></span>
      </button>
      <nav v-if="screen !== 'home'" class="session-stats">
        <span><i class="dot coral" /> Streak <b>{{ stats.streak }}</b></span>
        <span><i class="dot teal" /> Progress <b>{{ progressText }}</b></span>
        <span><i class="dot gold" /> Mastery <b>{{ masteryPercent }}%</b></span>
      </nav>
      <button class="tools-button" @click="showTools = true"><span>⊞</span> Tools</button>
      <button v-if="screen === 'quiz'" class="exit-button" @click="finishSession">End session</button>
      <button v-else-if="screen !== 'home'" class="exit-button" @click="goHome">Exit report</button>
      <div v-else class="best">Personal best <b>{{ stats.bestStreak }}</b> <span>⚡</span></div>
    </header>

    <main v-if="screen === 'home'" class="home">
      <section class="hero">
        <div class="hero-copy">
          <div class="kicker"><span /> CHM 1045C · EXAM 1</div>
          <h1>Less rereading.<br><em>More reps.</em></h1>
          <p>An adaptive chemistry grinder that brings back what you miss—until it sticks.</p>
          <div class="hero-actions">
            <button class="primary big" @click="start('learn')">Start 25-question session <span>→</span></button>
            <button v-if="resumeAvailable" class="resume-button" @click="resumeSession"><b>Resume saved session</b><small>Your exact question and attempts are saved</small></button>
          </div>
        </div>
        <div class="mastery-card">
          <div class="ring" :style="{ '--progress': `${masteryPercent * 3.6}deg` }">
            <div><strong>{{ masteryPercent }}%</strong><span>mastered</span></div>
          </div>
          <div class="mastery-copy">
            <small>OVERALL PROGRESS</small>
            <h2>{{ masteryPercent ? 'Keep the momentum.' : 'Ready when you are.' }}</h2>
            <p>{{ stats.attempted }} questions answered across {{ concepts.length }} concepts.</p>
          </div>
          <div class="molecule one" /><div class="molecule two" />
        </div>
      </section>

      <section class="mode-section">
        <div class="section-heading"><div><span>CHOOSE YOUR SESSION</span><h2>How do you want to practice?</h2></div><p>Your progress saves automatically in this browser.</p></div>
        <div class="mode-grid">
          <button class="mode-card featured" @click="start('learn')">
            <span class="tag">RECOMMENDED</span><span class="mode-icon">↗</span>
            <h3>Learn mode</h3><p>Adaptive practice that targets weak concepts and fades mastered ones.</p>
            <footer><span>25 questions</span><b>Start →</b></footer>
          </button>
          <button class="mode-card" @click="start('exam')">
            <span class="mode-icon">50</span><h3>Practice test</h3><p>A full 50-question mixed test with immediate results and first-attempt scoring.</p>
            <footer><span>50 questions</span><b>Begin →</b></footer>
          </button>
          <button class="mode-card" @click="start('weak')">
            <span class="mode-icon">◎</span><h3>Weak topics</h3><p>Focus your time on concepts with misses or low mastery.</p>
            <footer><span>20 questions</span><b>Target →</b></footer>
          </button>
          <button class="mode-card dark" @click="start('grind')">
            <span class="mode-icon">∞</span><h3>Quick grind</h3><p>Endless, fast mixed questions with immediate feedback.</p>
            <footer><span>No finish line</span><b>Grind →</b></footer>
          </button>
        </div>
      </section>

      <section class="topics">
        <div class="section-heading"><div><span>YOUR CONCEPT MAP</span><h2>Mastery by topic</h2></div><button class="text-button" @click="resetProgress">Reset progress</button></div>
        <div class="topic-grid">
          <article v-for="(items, group) in topicGroups" :key="group">
            <h3>{{ group }}</h3>
            <div v-for="item in items" :key="item[0]" class="concept-row">
              <div><span>{{ item[1] }}</span><small>{{ mastery[item[0]].correct }} right · {{ mastery[item[0]].wrong }} missed</small></div>
              <div class="bar"><i :style="{ width: mastery[item[0]].score + '%' }" /></div>
              <b>{{ mastery[item[0]].score }}%</b>
            </div>
          </article>
        </div>
      </section>
    </main>

    <main v-else-if="screen === 'quiz' && current" class="quiz-wrap">
      <section class="quiz-head">
        <div><div class="kicker"><span /> {{ modeTitle.toUpperCase() }}</div><h1>{{ current.topic }}</h1></div>
        <div v-if="mode === 'exam'" class="exam-progress"><span>QUESTION {{ examIndex + 1 }} OF 50</span><div><i :style="{ width: `${(examIndex + 1) * 2}%` }" /></div></div>
        <div v-else class="concept-meter"><span>CONCEPT MASTERY</span><b>{{ mastery[current.conceptId].score }}%</b><div><i :style="{ width: mastery[current.conceptId].score + '%' }" /></div></div>
      </section>

      <section class="question-card" :class="{ correct: submitted && wasCorrect, wrong: submitted && !wasCorrect }">
        <div class="question-number">{{ mode === 'exam' ? String(examIndex + 1).padStart(2, '0') : '•' }}</div>
        <div class="question-body">
          <span class="eyebrow">{{ current.eyebrow }}</span>
          <h2>{{ current.prompt }}</h2>
          <figure v-if="current.diagram" class="particle-board">
            <div class="particle-field">
              <div v-for="(molecule, i) in current.diagram.molecules" :key="`${molecule}-${i}`" class="particle-molecule" :class="`molecule-${molecule.length}`">
                <i v-for="(atom, j) in molecule.split('')" :key="j" :class="`atom-${atom}`">{{ atom }}</i>
              </div>
            </div>
            <figcaption>{{ current.diagram.caption }}</figcaption>
          </figure>
          <div v-if="current.choices" class="choices">
            <button v-for="(c, i) in current.choices" :key="c.value" :disabled="submitted" :class="{ selected: response === c.value, answer: submitted && c.value === current.answer, missed: submitted && response === c.value && !wasCorrect }" @click="response = c.value">
              <span>{{ String.fromCharCode(65 + i) }}</span><b>{{ c.label }}</b>
            </button>
          </div>
          <div v-else class="number-answer">
            <label><input ref="answerInput" v-model="response" :disabled="submitted" inputmode="decimal" autocomplete="off" placeholder="Type your answer"><span v-if="current.unit">{{ current.unit }}</span></label>
            <small>Scientific notation accepted as 3.5e-4</small>
          </div>

          <div v-if="submitted" class="feedback">
            <div class="feedback-icon">{{ wasCorrect ? '✓' : '×' }}</div>
            <div>
              <strong>{{ wasCorrect ? (currentAttempts > 1 ? `Correct on attempt ${currentAttempts}.` : 'Correct.') : (currentAttempts > 1 ? `Still incorrect — attempt ${currentAttempts}.` : 'Incorrect — first result recorded.') }}</strong>
              <p>{{ current.explanation }}</p>
              <div v-if="!wasCorrect" class="answer-comparison">
                <div class="correct-concept"><small>CORRECT ANSWER</small><b>{{ current.answer }} {{ current.unit }}</b><span v-if="correctDefinition">{{ correctDefinition.definition }}</span></div>
                <div v-if="selectedDefinition && selectedDefinition.id !== correctDefinition?.id" class="selected-concept"><small>YOUR CHOICE</small><b>{{ selectedDefinition.term }}</b><span>{{ selectedDefinition.definition }}</span></div>
              </div>
              <p v-if="!wasCorrect" class="attempt-note">Retry it now or move on. Your original first-attempt result stays in the report.</p>
            </div>
          </div>
          <div v-else-if="showHint && current.hint" class="hint"><b>Hint</b> {{ current.hint }}</div>

          <div class="actions">
            <button v-if="!submitted && mode !== 'exam' && current.hint" class="secondary" @click="showHint = !showHint">{{ showHint ? 'Hide hint' : 'Need a hint?' }}</button>
            <button v-else-if="submitted && !wasCorrect" class="secondary" @click="advanceQuestion">Next question</button>
            <span v-else />
            <button v-if="!submitted" class="primary" :disabled="!response" @click="submit">Check answer <span>→</span></button>
            <button v-else-if="!wasCorrect" class="primary retry" @click="retryQuestion">Retry question <span>↻</span></button>
            <button v-else class="primary" @click="advanceQuestion">{{ sessionTarget && questionPosition >= sessionTarget ? 'Finish & see report' : 'Next question' }} <span>→</span></button>
          </div>
        </div>
      </section>
      <p class="key-tip">Press <kbd>Enter</kbd> to {{ submitted && !wasCorrect ? 'retry' : submitted ? 'continue' : 'check your answer' }}</p>
    </main>

    <main v-else class="summary">
      <div class="summary-card">
        <span class="eyebrow">SESSION REPORT · FIRST ATTEMPTS</span>
        <h1>{{ sessionAccuracy }}<small>%</small></h1>
        <h2>{{ sessionAccuracy >= 80 ? 'Strong first-pass accuracy.' : 'Now we know what to hit.' }}</h2>
        <p>{{ firstTryCorrect }} of {{ sessionRecords.length }} correct on the first try · {{ recoveredCount }} recovered through retries.</p>
        <div class="report-metrics">
          <div><strong>{{ firstTryCorrect }}</strong><span>First-try correct</span></div>
          <div><strong>{{ sessionRecords.length - firstTryCorrect }}</strong><span>First-try misses</span></div>
          <div><strong>{{ recoveredCount }}</strong><span>Recovered</span></div>
        </div>
        <div class="review-list">
          <div v-for="record in sessionRecords" :key="record.question.id" :class="record.firstCorrect ? 'pass' : 'fail'">
            <b>{{ record.firstCorrect ? '✓' : '×' }}</b><span>{{ record.question.topic }}</span><small>{{ record.firstCorrect ? 'First try' : record.solved ? `Recovered in ${record.attempts}` : 'Needs review' }}</small>
          </div>
        </div>
        <button class="primary big" @click="start('weak')">Practice weak topics <span>→</span></button>
        <button class="text-button" @click="goHome">Back to dashboard</button>
      </div>
    </main>

    <div v-if="showTools" class="modal-backdrop" @click.self="showTools = false">
      <section class="tools-modal" role="dialog" aria-modal="true" aria-labelledby="tools-title">
        <header><div><span class="eyebrow">COURSE REFERENCE</span><h2 id="tools-title">Tools & conversion factors</h2></div><button @click="showTools = false" aria-label="Close tools">×</button></header>
        <div class="tool-columns">
          <article>
            <h3>Metric prefixes</h3>
            <dl><div><dt>kilo (k)</dt><dd>10³</dd></div><div><dt>deci (d)</dt><dd>10⁻¹</dd></div><div><dt>centi (c)</dt><dd>10⁻²</dd></div><div><dt>milli (m)</dt><dd>10⁻³</dd></div><div><dt>micro (μ)</dt><dd>10⁻⁶</dd></div><div><dt>nano (n)</dt><dd>10⁻⁹</dd></div><div><dt>pico (p)</dt><dd>10⁻¹²</dd></div></dl>
          </article>
          <article>
            <h3>Metric ↔ English</h3>
            <dl><div v-for="factor in conversionFactors" :key="factor[1]"><dt>{{ factor[1] }}</dt><dd>{{ factor[2] }}</dd></div></dl>
          </article>
          <article>
            <h3>Course equations</h3>
            <dl class="equations"><div><dt>Density</dt><dd>d = m ÷ V</dd></div><div><dt>Temperature</dt><dd>K = °C + 273</dd></div><div><dt>Percent error</dt><dd>|measured − accepted| / accepted × 100</dd></div><div><dt>Mass number</dt><dd>A = protons + neutrons</dd></div><div><dt>Ion charge</dt><dd>protons − electrons</dd></div></dl>
          </article>
          <article>
            <h3>Unit-cancellation reminder</h3>
            <div class="factor-example"><span>given unit</span><b>×</b><span><u>wanted unit</u><u>given unit</u></span></div>
            <p>Place the unwanted unit opposite its starting position so it cancels. Square or cube the entire conversion factor for area or volume.</p>
          </article>
        </div>
        <footer><small>Factors match the precision used by this question bank.</small><button class="primary" @click="showTools = false">Back to question</button></footer>
      </section>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
:root { color-scheme: light; --ink:#162a2d; --muted:#68787a; --paper:#f5f1e8; --white:#fffdf8; --teal:#0c827d; --deep:#075c59; --coral:#f16f5d; --gold:#e5b84e; --line:#d8d5cb; }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font-family:Manrope, sans-serif; }
button,input { font:inherit; }
button { color:inherit; }
.app-shell { min-height:100vh; background:radial-gradient(circle at 85% 8%,rgba(12,130,125,.08),transparent 23%),var(--paper); }
.topbar { height:78px; display:flex; align-items:center; padding:0 max(28px,calc((100vw - 1240px)/2)); border-bottom:1px solid var(--line); background:rgba(245,241,232,.86); backdrop-filter:blur(12px); position:relative; z-index:5; }
.brand { border:0; background:none; display:flex; align-items:center; gap:11px; font-size:15px; letter-spacing:.14em; font-weight:500; cursor:pointer; padding:0; }
.brand b { color:var(--teal); }.brand-mark { width:34px;height:34px;background:var(--ink);color:var(--paper);display:grid;place-items:center;font-weight:800;font-size:18px;transform:rotate(-3deg); }
.best { margin-left:18px; text-transform:uppercase; letter-spacing:.1em; font:12px 'DM Mono'; color:var(--muted); }.best b { color:var(--ink);font-size:15px;margin-left:8px; }.best span { color:var(--gold); }
.home { max-width:1240px; margin:auto; padding:70px 28px 90px; }
.hero { display:grid; grid-template-columns:1.07fr .93fr; gap:70px; align-items:center; padding-bottom:82px; }
.kicker,.section-heading span,.eyebrow { font:500 11px 'DM Mono'; letter-spacing:.16em; text-transform:uppercase; color:var(--teal); }.kicker span { display:inline-block;width:28px;height:2px;background:var(--coral);vertical-align:middle;margin-right:9px; }
.hero h1 { font-size:clamp(52px,6vw,82px); letter-spacing:-.065em; line-height:.96; margin:22px 0 24px; font-weight:700; }.hero h1 em { color:var(--teal);font-style:normal;position:relative; }.hero h1 em:after { content:'';position:absolute;left:1%;right:0;bottom:-5px;height:8px;background:var(--coral);opacity:.75;clip-path:polygon(0 28%,100% 0,98% 62%,2% 100%); }
.hero-copy>p { font-size:18px;line-height:1.65;color:var(--muted);max-width:535px;margin-bottom:32px; }
.hero-actions{display:flex;align-items:stretch;gap:13px;flex-wrap:wrap}.resume-button{border:1px solid var(--teal);background:transparent;padding:10px 16px;text-align:left;cursor:pointer;min-width:205px}.resume-button b,.resume-button small{display:block}.resume-button b{font-size:12px;color:var(--teal)}.resume-button small{font-size:9px;color:var(--muted);margin-top:4px}
.primary { border:0;background:var(--teal);color:white;padding:15px 22px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:32px;box-shadow:4px 4px 0 var(--ink);transition:.15s; }.primary:hover:not(:disabled){transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}.primary:disabled{opacity:.38;cursor:not-allowed}.primary.big{padding:18px 25px;font-size:15px;width:max-content;min-width:205px}.primary span{font-size:20px}.secondary{background:transparent;border:1px solid var(--line);padding:14px 18px;cursor:pointer;font-weight:700}.secondary:hover{border-color:var(--teal);color:var(--teal)}
.mastery-card { min-height:370px;background:var(--ink);color:white;position:relative;display:flex;align-items:center;justify-content:center;gap:34px;overflow:hidden;box-shadow:12px 12px 0 rgba(12,130,125,.2); }.mastery-card:before{content:'';position:absolute;inset:14px;border:1px solid rgba(255,255,255,.12)}
.ring{--progress:0deg;width:174px;height:174px;border-radius:50%;background:conic-gradient(var(--coral) var(--progress),rgba(255,255,255,.12) 0);display:grid;place-items:center;position:relative}.ring:after{content:'';position:absolute;width:142px;height:142px;border-radius:50%;background:var(--ink)}.ring>div{z-index:1;text-align:center}.ring strong{display:block;font-size:42px;letter-spacing:-.05em}.ring span{font:10px 'DM Mono';letter-spacing:.13em;text-transform:uppercase;color:#9fb2b3}
.mastery-copy{width:190px;z-index:1}.mastery-copy small{font:10px 'DM Mono';letter-spacing:.15em;color:#8bb8b5}.mastery-copy h2{font-size:24px;line-height:1.15;margin:12px 0}.mastery-copy p{font-size:13px;color:#aab8b9;line-height:1.6}.molecule{position:absolute;border:1px solid rgba(255,255,255,.1);border-radius:50%}.molecule:before,.molecule:after{content:'';position:absolute;border-radius:50%;background:var(--coral)}.molecule.one{width:80px;height:80px;right:-25px;top:25px}.molecule.one:before{width:11px;height:11px;left:-6px;top:33px}.molecule.two{width:120px;height:120px;left:-45px;bottom:-40px}.molecule.two:after{width:9px;height:9px;right:6px;top:5px;background:var(--gold)}
.mode-section,.topics{border-top:1px solid var(--line);padding-top:38px}.section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:25px}.section-heading h2{font-size:30px;letter-spacing:-.035em;margin:8px 0 0}.section-heading p{color:var(--muted);font-size:13px}.mode-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:80px}.mode-card{text-align:left;border:1px solid var(--line);background:rgba(255,253,248,.65);padding:25px 22px 20px;min-height:260px;cursor:pointer;position:relative;transition:.2s;display:flex;flex-direction:column}.mode-card:hover{transform:translateY(-5px);border-color:var(--teal);box-shadow:0 12px 30px rgba(22,42,45,.08)}.mode-card.featured{border:2px solid var(--teal);background:var(--white)}.mode-card.dark{background:var(--ink);color:white;border-color:var(--ink)}.tag{position:absolute;right:12px;top:12px;background:#dceeea;color:var(--deep);font:9px 'DM Mono';padding:5px 7px;letter-spacing:.08em}.mode-icon{font:700 20px 'DM Mono';color:var(--coral);height:48px;display:block}.mode-card h3{font-size:20px;margin:12px 0 9px}.mode-card p{font-size:13px;line-height:1.55;color:var(--muted);margin:0}.dark p{color:#9fb0b1}.mode-card footer{margin-top:auto;padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font:11px 'DM Mono';color:var(--muted)}.mode-card footer b{color:var(--teal)}.dark footer{border-color:#385053}.dark footer b{color:#6bd1c9}
.topics{padding-bottom:30px}.topic-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}.topic-grid article{background:rgba(255,253,248,.6);border:1px solid var(--line);padding:22px}.topic-grid article h3{font-size:12px;text-transform:uppercase;letter-spacing:.13em;margin:0 0 18px;color:var(--teal)}.concept-row{display:grid;grid-template-columns:210px 1fr 38px;align-items:center;gap:13px;padding:9px 0}.concept-row>div:first-child span{display:block;font-size:12px;font-weight:700}.concept-row small{display:block;color:#9a9f9b;font-size:9px;margin-top:2px}.bar{height:5px;background:#dfddd5}.bar i{height:100%;display:block;background:var(--teal);transition:.4s}.concept-row>b{font:10px 'DM Mono';text-align:right}.text-button{border:0;background:none;color:var(--teal);text-decoration:underline;text-underline-offset:4px;cursor:pointer;font-size:12px}
.session-stats{display:flex;gap:28px;margin-left:auto;margin-right:22px}.session-stats span{font:10px 'DM Mono';text-transform:uppercase;color:var(--muted);letter-spacing:.08em}.session-stats b{color:var(--ink);margin-left:5px;font-size:12px}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:3px}.coral{background:var(--coral)}.teal{background:var(--teal)}.gold{background:var(--gold)}.tools-button{margin-left:auto;background:var(--white);border:1px solid var(--line);padding:9px 13px;font-size:11px;font-weight:800;cursor:pointer}.session-stats+.tools-button{margin-left:0}.tools-button span{color:var(--teal);font-size:15px;margin-right:4px}.exit-button{background:none;border:1px solid var(--line);border-left:0;padding:9px 13px;font-size:11px;cursor:pointer}
.quiz-wrap{max-width:930px;margin:0 auto;padding:55px 28px 80px}.quiz-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:25px}.quiz-head h1{font-size:27px;margin:8px 0 0;letter-spacing:-.03em}.concept-meter,.exam-progress{width:230px}.concept-meter span,.exam-progress span{font:9px 'DM Mono';letter-spacing:.12em;color:var(--muted)}.concept-meter b{float:right;font:12px 'DM Mono'}.concept-meter>div,.exam-progress>div{height:5px;background:#dcd9d0;margin-top:8px}.concept-meter i,.exam-progress i{height:100%;display:block;background:var(--teal);transition:.3s}
.question-card{background:var(--white);border:1px solid var(--line);display:grid;grid-template-columns:72px 1fr;min-height:500px;box-shadow:8px 8px 0 rgba(22,42,45,.08)}.question-card.correct{border-top:4px solid var(--teal)}.question-card.wrong{border-top:4px solid var(--coral)}.question-number{background:var(--ink);color:white;display:flex;justify-content:center;padding-top:33px;font:600 18px 'DM Mono'}.question-body{padding:43px 50px 38px}.question-body h2{font-size:26px;line-height:1.4;letter-spacing:-.025em;margin:13px 0 30px;max-width:680px}.choices{display:grid;grid-template-columns:1fr 1fr;gap:12px}.choices button{background:white;border:1px solid var(--line);padding:15px;text-align:left;display:flex;align-items:center;gap:14px;cursor:pointer;min-height:58px}.choices button:hover:not(:disabled),.choices button.selected{border:2px solid var(--teal);padding:14px;background:#edf7f5}.choices button.answer{border-color:var(--teal);background:#e5f4f0}.choices button.missed{border-color:var(--coral);background:#fff0ec}.choices button>span{width:27px;height:27px;border:1px solid var(--line);display:grid;place-items:center;font:11px 'DM Mono';flex:none}.choices button b{font-size:13px}.number-answer label{border-bottom:2px solid var(--ink);display:flex;max-width:430px;align-items:center}.number-answer input{border:0;background:transparent;outline:0;width:100%;font-size:28px;padding:13px 4px}.number-answer label span{font:14px 'DM Mono';color:var(--muted)}.number-answer small{font:10px 'DM Mono';color:var(--muted);display:block;margin-top:9px}.actions{display:flex;justify-content:space-between;align-items:center;margin-top:34px;padding-top:24px;border-top:1px solid var(--line)}
.particle-board{margin:-10px 0 26px;border:1px solid var(--line);background:#f7f4ec}.particle-field{min-height:180px;padding:25px;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;justify-items:center;gap:18px;background-image:radial-gradient(rgba(22,42,45,.08) 1px,transparent 1px);background-size:15px 15px}.particle-molecule{display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 2px rgba(22,42,45,.15));transform:rotate(var(--turn,0deg))}.particle-molecule:nth-child(2n){--turn:18deg}.particle-molecule:nth-child(3n){--turn:-22deg}.particle-molecule i{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;font:500 9px 'DM Mono';font-style:normal;border:2px solid var(--white);margin-left:-5px}.particle-molecule i:first-child{margin-left:0}.particle-molecule .atom-A{background:var(--teal);color:white}.particle-molecule .atom-B{background:var(--coral);color:white}.particle-board figcaption{padding:9px 13px;border-top:1px solid var(--line);font:9px 'DM Mono';color:var(--muted);text-align:center}
.feedback{margin-top:25px;padding:18px;display:flex;gap:14px;background:#edf7f5;border-left:4px solid var(--teal)}.feedback>div:last-child{flex:1}.wrong .feedback{background:#fff0ec;border-color:var(--coral)}.feedback-icon{width:28px;height:28px;border-radius:50%;background:var(--teal);color:white;display:grid;place-items:center;font-weight:800;flex:none}.wrong .feedback-icon{background:var(--coral)}.feedback strong{font-size:14px}.feedback p{font-size:12px;line-height:1.55;margin:3px 0 0;color:var(--muted)}.answer-comparison{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.answer-comparison>div{background:rgba(255,255,255,.72);border:1px solid var(--line);padding:11px}.answer-comparison .correct-concept{border-color:var(--teal)}.answer-comparison .selected-concept{border-color:var(--coral)}.answer-comparison small,.answer-comparison b,.answer-comparison span{display:block}.answer-comparison small{font:8px 'DM Mono';letter-spacing:.1em;color:var(--muted)}.answer-comparison b{font-size:12px;margin:4px 0}.answer-comparison span{font-size:10px;line-height:1.45;color:var(--muted)}.feedback .attempt-note{margin-top:10px;font-size:10px}.hint{margin-top:20px;border-left:3px solid var(--gold);padding:12px 15px;background:#faf5e6;font-size:12px;color:var(--muted)}.hint b{color:var(--ink);margin-right:7px}.key-tip{text-align:center;color:#899294;font:10px 'DM Mono';margin-top:24px}.key-tip kbd{background:white;border:1px solid var(--line);padding:3px 6px;box-shadow:0 2px 0 var(--line)}
.summary{max-width:700px;margin:0 auto;padding:65px 28px}.summary-card{text-align:center;background:var(--white);border:1px solid var(--line);padding:48px;box-shadow:10px 10px 0 rgba(12,130,125,.15)}.summary-card>h1{font-size:78px;margin:12px 0 0;color:var(--teal);letter-spacing:-.06em}.summary-card>h1 small{font-size:25px;color:var(--muted)}.summary-card>h2{font-size:27px;margin:0}.summary-card>p{color:var(--muted);font-size:13px}.review-list{display:grid;grid-template-columns:1fr 1fr;text-align:left;gap:6px;margin:30px 0}.review-list div{display:grid;grid-template-columns:20px 1fr auto;gap:8px;padding:10px;background:#f5f3ed;font-size:11px;align-items:center}.review-list .pass>b{color:var(--teal)}.review-list .fail>b{color:var(--coral)}.review-list small{color:var(--muted)}.summary-card>.primary{margin:20px auto 15px}.summary-card>.text-button{display:block;margin:auto}
.report-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:27px 0 0}.report-metrics div{background:var(--paper);border:1px solid var(--line);padding:16px 8px}.report-metrics strong{display:block;font-size:25px;color:var(--ink)}.report-metrics span{display:block;margin-top:3px;font:9px 'DM Mono';text-transform:uppercase;color:var(--muted)}.primary.retry{background:var(--coral)}
.modal-backdrop{position:fixed;inset:0;z-index:50;background:rgba(9,26,28,.72);display:grid;place-items:center;padding:24px;backdrop-filter:blur(5px)}.tools-modal{width:min(820px,100%);max-height:90vh;overflow:auto;background:var(--white);border:1px solid var(--ink);box-shadow:12px 12px 0 rgba(0,0,0,.25)}.tools-modal>header{display:flex;align-items:start;justify-content:space-between;padding:28px 30px 22px;border-bottom:1px solid var(--line)}.tools-modal h2{font-size:25px;margin:7px 0 0;letter-spacing:-.03em}.tools-modal>header>button{border:0;background:var(--ink);color:white;width:34px;height:34px;font-size:22px;cursor:pointer}.tool-columns{display:grid;grid-template-columns:1fr 1fr}.tool-columns article{padding:23px 30px;border-bottom:1px solid var(--line)}.tool-columns article:nth-child(odd){border-right:1px solid var(--line)}.tool-columns h3{font:600 11px 'DM Mono';letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin:0 0 14px}.tool-columns dl{margin:0}.tool-columns dl div{display:flex;justify-content:space-between;gap:15px;padding:7px 0;border-bottom:1px dotted #d8d5cb;font-size:11px}.tool-columns dt{font-weight:700}.tool-columns dd{margin:0;color:var(--muted);font-family:'DM Mono'}.equations div{align-items:center}.equations dd{color:var(--ink);font-weight:500}.tool-columns p{font-size:11px;color:var(--muted);line-height:1.55}.factor-example{display:flex;align-items:center;gap:13px;background:var(--paper);padding:15px;font:11px 'DM Mono'}.factor-example>span:last-child{display:flex;flex-direction:column;text-align:center}.factor-example u{text-decoration:none;padding:3px 8px}.factor-example u:first-child{border-bottom:1px solid var(--ink)}.tools-modal>footer{display:flex;justify-content:space-between;align-items:center;padding:18px 30px}.tools-modal>footer small{font:9px 'DM Mono';color:var(--muted)}.tools-modal>footer .primary{box-shadow:none;padding:11px 16px}
@media(max-width:900px){.hero{grid-template-columns:1fr;gap:45px}.mode-grid{grid-template-columns:1fr 1fr}.session-stats span:nth-child(2){display:none}.topic-grid{grid-template-columns:1fr}.mastery-card{min-height:310px}}
@media(max-width:620px){.topbar{height:65px;padding:0 18px}.brand span:last-child{display:none}.best{display:none}.tools-button{margin-left:auto}.session-stats{gap:10px;margin-right:8px}.session-stats span:nth-child(3){display:none}.tools-button{padding:7px 9px}.exit-button{padding:7px}.home{padding:45px 18px}.hero{padding-bottom:58px}.hero h1{font-size:49px}.mastery-card{flex-direction:column;gap:5px;padding:30px;text-align:center}.mastery-copy{width:230px}.mode-grid{grid-template-columns:1fr}.section-heading>p{display:none}.topic-grid{display:block}.topic-grid article{margin-bottom:10px}.concept-row{grid-template-columns:1fr 70px 32px}.quiz-wrap{padding:35px 14px}.quiz-head{align-items:start}.concept-meter,.exam-progress{width:120px}.question-card{grid-template-columns:1fr}.question-number{display:none}.question-body{padding:30px 22px}.question-body h2{font-size:21px}.choices{grid-template-columns:1fr}.particle-field{grid-template-columns:repeat(3,1fr);padding:20px 12px}.actions{gap:12px}.actions .primary{gap:15px}.review-list{grid-template-columns:1fr}.summary-card{padding:35px 20px}.tool-columns{grid-template-columns:1fr}.tool-columns article:nth-child(odd){border-right:0}.tools-modal>header,.tool-columns article{padding-left:20px;padding-right:20px}.tools-modal>footer{padding:15px 20px;gap:14px}}
</style>
