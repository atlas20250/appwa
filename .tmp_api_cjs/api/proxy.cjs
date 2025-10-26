"use strict";
const { createRequire } = require('module');
const requireFromHere = createRequire(__filename);
const compiled = requireFromHere('./proxy.js');
// If compiled module exported default, forward it, otherwise forward module.exports
const handler = compiled && compiled.default ? compiled.default : compiled;
module.exports = handler;
