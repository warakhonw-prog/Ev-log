const fs = require('fs');

const filePath = 'C:/Users/maxgiwer/.gemini/antigravity/brain/2143cad7-490a-4dba-9528-42c0505774b7/.system_generated/steps/470/content.md';
const content = fs.readFileSync(filePath, 'utf8');

const prefix = 'goog.script.init("';
const start = content.indexOf(prefix) + prefix.length;
const end = content.indexOf('", ""', start);
const raw = content.substring(start, end);

// Decode js string safely
const jsonStr = Function('"use strict";return ("' + raw + '");')();
const parsed = JSON.parse(jsonStr);

fs.writeFileSync('d:/ev/extracted_dashboard.html', parsed.userHtml, 'utf8');
console.log('Successfully extracted HTML! Length:', parsed.userHtml.length);
