// Parse article (EN) — the writer's JSON reply → the writer-owned fields + its references.
/*__LIB_LITE__*/
const raw = $input.first().json.text;
const a = parseLooseJson(raw, 'Write article (EN)');
return [{ json: { article: writerFields(a), references: Array.isArray(a.references) ? a.references : [] }, pairedItem: { item: 0 } }];
