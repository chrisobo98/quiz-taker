<script setup lang="ts">
import { useQuizEngineContext } from '../../composables/quizEngineContext'
const { showTools, toolsTab, activeQuiz, conversionFactors, elementQuery, periodicTable, matchingElementNumbers, selectedElement, elementCategories } = useQuizEngineContext()
</script>

<template>
<div v-if="showTools" class="modal-backdrop" @click.self="showTools = false">
      <section class="tools-modal" role="dialog" aria-modal="true" aria-labelledby="tools-title">
        <header><div><AppEyebrow>COURSE REFERENCE</AppEyebrow><h2 id="tools-title">Tools & conversion factors</h2></div><button @click="showTools = false" aria-label="Close tools">×</button></header>
        <nav class="tools-tabs">
          <button :class="{ active: toolsTab === 'reference' }" @click="toolsTab = 'reference'">Reference tools</button>
          <button v-if="activeQuiz.subject === 'chemistry'" :class="{ active: toolsTab === 'periodic' }" @click="toolsTab = 'periodic'">Periodic table</button>
        </nav>
        <div v-if="toolsTab === 'reference'" class="tool-columns">
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
        <div v-else class="periodic-panel">
          <div class="periodic-toolbar">
            <div><AppEyebrow>{{ activeQuiz.title }}</AppEyebrow><h3>Periodic table of the elements</h3></div>
            <label><span>Search</span><input v-model="elementQuery" placeholder="Name, symbol, or number"></label>
          </div>
          <div class="periodic-scroll">
            <div class="periodic-grid" aria-label="Periodic table of the elements">
              <button v-for="element in periodicTable" :key="element.atomicNumber" class="element-tile" :class="[`category-${element.category}`, { dimmed: !matchingElementNumbers.has(element.atomicNumber), selected: selectedElement?.atomicNumber === element.atomicNumber }]" :style="{ gridColumn: element.group, gridRow: element.displayRow || element.period }" @click="selectedElement = element">
                <small>{{ element.atomicNumber }}</small><strong>{{ element.symbol }}</strong><span>{{ element.name }}</span><em>{{ element.atomicMass }}</em>
              </button>
            </div>
          </div>
          <div class="element-detail" :class="selectedElement ? `category-${selectedElement.category}` : ''">
            <template v-if="selectedElement">
              <strong>{{ selectedElement.symbol }}</strong><div><h4>{{ selectedElement.name }}</h4><p>Atomic number {{ selectedElement.atomicNumber }} · Atomic mass {{ selectedElement.atomicMass }} · Period {{ selectedElement.period }} · Group {{ selectedElement.group }}</p></div>
              <button @click="selectedElement = null">Clear</button>
            </template>
            <p v-else>Tap an element to inspect its name, atomic number, atomic mass, period, and group.</p>
          </div>
          <div class="periodic-legend"><span v-for="category in elementCategories" :key="category.id" :class="`category-${category.id}`"><i />{{ category.label }}</span></div>
          <p class="periodic-note">Bracketed values are mass numbers used for elements without a standard atomic weight.</p>
        </div>
        <footer><small>Factors match the precision used by this question bank.</small><button class="primary" @click="showTools = false">Back to question</button></footer>
      </section>
    </div>
</template>
