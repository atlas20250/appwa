"use strict";
const { createRequire } = require('module');
const requireFromHere = createRequire(__filename);
const compiled = requireFromHere('./db.js');
// Export everything from the compiled module
for (const k of Object.keys(compiled)) {
	exports[k] = compiled[k];
}
