/**
 * Merges an HTML template string with a data object, replacing placeholders.
 * This function is dependency-free and supports simple variable replacement,
 * conditionals ({{#if ...}}), and loops ({{#each ...}}).
 *
 * @param {string} template The template string containing placeholders.
 * @param {object} data The data object with values to insert.
 * @returns {string} The processed HTML string with data merged.
 *
 * @example
 * // 1. Basic Replacement
 * const template1 = '<p>Hola, {{name}}!</p>';
 * const data1 = { name: 'Mundo' };
 * mergeTemplate(template1, data1);
 * // Returns: '<p>Hola, Mundo!</p>'
 *
 * @example
 * // 2. Loop with {{#each}}
 * const template2 = '<ul>{{#each users}}<li>{{name}} ({{email}})</li>{{/each}}</ul>';
 * const data2 = { users: [{name: 'Alice', email: 'a@ex.com'}, {name: 'Bob', email: 'b@ex.com'}] };
 * mergeTemplate(template2, data2);
 * // Returns: '<ul><li>Alice (a@ex.com)</li><li>Bob (b@ex.com)</li></ul>'
 *
 * @example
 * // 3. Conditional with {{#if}}
 * const template3 = '<div>{{#if showDetails}}<p>Detalles visibles.</p>{{/if}}<p>Fin.</p></div>';
 * const data3 = { showDetails: true };
 * mergeTemplate(template3, data3);
 * // Returns: '<div><p>Detalles visibles.</p><p>Fin.</p></div>'
 * // With { showDetails: false }, it would return: '<div><p>Fin.</p></div>'
 */
function mergeTemplate(template, data) {
  if (!template || !data) {
    return template || '';
  }

  let processedHtml = template;

  // 1. Process conditionals: {{#if variable}}...{{/if}}
  // This regex finds the conditional block and captures the variable name and the content.
  processedHtml = processedHtml.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, block) => {
    const value = data[variable.trim()];
    // Check for "truthy" values, including non-empty arrays.
    const isTruthy = Array.isArray(value) ? value.length > 0 : !!value;
    return isTruthy ? block : '';
  });

  // 2. Process loops: {{#each arrayName}}...{{/each}}
  // This regex finds the loop block and captures the array name and the content.
  processedHtml = processedHtml.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, block) => {
    const items = data[arrayName.trim()];
    if (!Array.isArray(items)) {
      return ''; // If data is not an array, remove the block
    }
    // For each item in the array, process the inner block.
    return items.map(item => {
      // Recursively call mergeTemplate for the block content.
      // The scope includes the item's properties and the parent data for accessing global vars.
      // Item properties will overwrite parent properties if names conflict.
      const scopedData = { ...data, ...item };
      return mergeTemplate(block, scopedData);
    }).join('');
  });

  // 3. Process simple replacements: {{variable}} or {{object.key}}
  // This regex finds all simple placeholders.
  processedHtml = processedHtml.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    // Support dot notation for nested objects
    const keys = trimmedKey.split('.');
    let value = data;
    for (const k of keys) {
      if (value === null || typeof value !== 'object') {
        value = undefined; // Path is invalid
        break;
      }
      value = value[k];
    }
    // Return the value as a string, or an empty string if it's null/undefined.
    return value !== null && value !== undefined ? String(value) : '';
  });

  return processedHtml;
}

export { mergeTemplate };
