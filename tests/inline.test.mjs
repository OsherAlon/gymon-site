import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderInline, refsIn, linksIn, plainText, bidiWrap } from '../src/lib/article/inline.mjs';

const opts = { lang: 'en', refNumber: (id) => ({ r1: 1, r2: 2 })[id], refPopoverId: (id) => `pop-${id}` };

test('escapes everything that is not the closed inline syntax', () => {
  const html = renderInline('<script>alert(1)</script> & "x"', opts);
  assert.equal(html, '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;');
});

test('bold, citations and internal links', () => {
  const html = renderInline('A **key** claim [[r1, r2]] and [more](/blog/rest-between-sets).', opts);
  assert.match(html, /<strong>key<\/strong>/);
  assert.match(html, /claim<sup class="cite" dir="ltr"><button[^>]*popovertarget="pop-r1"[^>]*>1<\/button>,<button[^>]*>2<\/button><\/sup>/);
  assert.match(html, /<a href="\/blog\/rest-between-sets">more<\/a>/);
});

test('external links are not rendered as links', () => {
  const html = renderInline('see [this](/evil.com) and [x](https://evil.com)', opts);
  assert.doesNotMatch(html, /href="\/evil/);
  assert.doesNotMatch(html, /href="https/);
});

test('refsIn / linksIn / plainText', () => {
  const t = 'One [[r2]] two [[r1,r2]] [a](/he/blog/x-y).';
  assert.deepEqual(refsIn(t), ['r2', 'r1']);
  assert.deepEqual(linksIn(t), ['/he/blog/x-y']);
  assert.equal(plainText('A **b** c [[r1]].'), 'A b c.');
});

test('Hebrew bidi safety net wraps dash and × ranges between numbers', () => {
  assert.equal(bidiWrap('8–12 חזרות'), '<span dir="ltr">8–12</span> חזרות');
  assert.equal(bidiWrap('3×10'), '<span dir="ltr">3×10</span>');
  assert.equal(bidiWrap('8 עד 12'), '8 עד 12');
  assert.match(renderInline('בין 8–12 חזרות', { lang: 'he' }), /<span dir="ltr">8–12<\/span>/);
  assert.doesNotMatch(renderInline('8–12', { lang: 'en' }), /span/);
});
