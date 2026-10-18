// This sandbox's shared settings: its name, goal and pages. Every page includes this file, so
// they're written once. Add a line to `pages` for each new page.
document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('sb-shell');
  shell.heading = '{{Sandbox name}}';
  shell.goal = '{{What this sandbox helps people understand or discover, in one or two sentences.}}';
  shell.pages = [
    { href: 'index.html', title: '{{First page}}' }
  ];
});
