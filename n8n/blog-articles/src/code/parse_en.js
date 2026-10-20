// Parse article (EN) — the writer's JSON reply → the writer-owned fields + its references.
/*__LIB_LITE__*/
/*__LLM_TEXT__*/
const raw = llmText($input.first().json, 'Write article (EN)');
const a = markApplyFromCta(parseLooseJson(raw, 'Write article (EN)'));
return [{ json: { article: writerFields(a), references: Array.isArray(a.references) ? a.references : [] }, pairedItem: { item: 0 } }];
