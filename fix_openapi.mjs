import fs from 'fs';
import path from 'path';

const file = 'C:/Users/sekou/Desktop/Onoot-Boutique/lib/api-spec/openapi.yaml';
let content = fs.readFileSync(file, 'utf8');

// Replacements for path parameters
content = content.replace(/- name: id\s+in: path\s+required: true\s+schema: { type: integer }/g, '- name: id\n          in: path\n          required: true\n          schema: { type: string }');
content = content.replace(/- name: productId\s+in: path\s+required: true\s+schema: { type: integer }/g, '- name: productId\n          in: path\n          required: true\n          schema: { type: string }');

// Replacements for query parameters
content = content.replace(/- name: userId\s+in: query\s+schema: { type: integer }/g, '- name: userId\n          in: query\n          schema: { type: string }');

// Replacements for schema properties
content = content.replace(/id: { type: integer }/g, 'id: { type: string }');
content = content.replace(/productId: { type: integer }/g, 'productId: { type: string }');
content = content.replace(/userId: { type: integer }/g, 'userId: { type: string }');
content = content.replace(/userId: { type: \["integer", "null"\] }/g, 'userId: { type: ["string", "null"] }');

fs.writeFileSync(file, content);
console.log('Fixed openapi.yaml');
