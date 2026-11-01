// Source migration: wrap supported interface copy in reactive React translations.
// Leaves catalog names, API messages and unknown English copy unchanged.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { messages } from "../src/lib/translations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
function files(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : entry.name.endsWith(".jsx") ? [path.join(directory, entry.name)] : []); }
let count = 0;
for (const file of [...files(path.join(root, "components")), ...files(path.join(root, "pages"))]) {
  if (file.endsWith("Translation.jsx")) continue;
  const source = fs.readFileSync(file, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  const edits = [];
  function visit(node, parent, inTranslation = false) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXElement" && node.openingElement.name.name === "T") inTranslation = true;
    if (!inTranslation && node.type === "JSXText") {
      const key = node.value.replace(/\s+/g, " ").trim();
      if (Object.hasOwn(messages, key)) {
        const before = node.value.match(/^\s*/)[0], after = node.value.match(/\s*$/)[0];
        edits.push({ start: node.start, end: node.end, text: `${before}<T>{${JSON.stringify(key)}}</T>${after}` });
      }
    }
    if (!inTranslation && node.type === "JSXExpressionContainer" && parent?.type !== "JSXAttribute") {
      const expression = node.expression;
      const member = expression?.type === "MemberExpression" && ["label", "title", "subtitle"].includes(expression.property?.name);
      const conditional = expression?.type === "ConditionalExpression" && [expression.consequent, expression.alternate].some(value => value.type === "StringLiteral" && Object.hasOwn(messages, value.value));
      if (member || conditional) {
        edits.push({ start: node.start, end: node.end, text: `<T>${source.slice(node.start, node.end)}</T>` });
        return;
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(child => { if (child?.type) visit(child, node, inTranslation); });
      else if (value?.type) visit(value, node, inTranslation);
    }
  }
  visit(ast);
  if (!edits.length) continue;
  let result = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  if (!/^import \{ T \} from/m.test(source)) result = 'import { T } from "@/components/common/Translation";\n' + result;
  fs.writeFileSync(file, result);
  count += 1;
}
console.log(`Localized supported interface copy in ${count} components/pages.`);
