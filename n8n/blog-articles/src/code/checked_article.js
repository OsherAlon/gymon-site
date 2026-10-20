// Checked article — attaches the Haiku fact-check to the validated bundle. Its findings are
// flags for the reviewer, shown first on the review page. Only the deterministic errors
// (validator, cross-language structure, DOI/PMID/URL resolution) block Approve: a model's
// judgement must not be able to lock an article.
const b = $('Reference results').first().json;
const notes = $input.first().json.output || {};
const blocking = b.counts.errors;
return [{ json: { ...b, check_notes: notes, blocking }, pairedItem: { item: 0 } }];
