// This sandbox's shared settings: its name, goal and pages, and comment mode. Every page includes
// this file, so they're written once. Add a line to `pages` for each new page.
document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('sb-shell');
  shell.heading = '{{Sandbox name}}';
  shell.goal = '{{What this sandbox helps people understand or discover, in one or two sentences.}}';
  shell.pages = [
    { href: 'index.html', title: '{{First page}}' }
  ];

  // Comment mode, on every page (see the feedback practice). The version is the latest entry in
  // JOURNAL.md, so each comment says what it was made on.
  const comments = document.querySelector('sb-comments');
  comments.context = { title: shell.heading, version: '0.1.0', goal: shell.goal };
  comments.addEventListener('sb-pick', (e) => comments.pick(refsAt(e.detail.x, e.detail.y)));
});

// What a comment at a point is about: the refs there, innermost first, and the part clicked.
// The locating practice adds the view it's in.
function refsAt(x, y) {
  const top = document.elementsFromPoint(x, y).find((el) => !el.closest('sb-comments'));
  if (!top) return null;
  const refs = [];
  for (let el = top.closest('[data-ref]'); el; el = el.parentElement?.closest('[data-ref]')) refs.push(el.dataset.ref);
  return { refs, view: null, element: top.closest('[data-ref]') ?? top };
}
