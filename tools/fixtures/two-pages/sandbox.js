// This sandbox's shared settings: its name, goal and pages. Every page includes this file.
document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('sb-shell');
  shell.heading = 'Lemonade stand';
  shell.goal = 'See how the price of a cup changes how many sell, and what the stand earns.';
  shell.pages = [
    { href: 'index.html', title: 'Setting a price' },
    { href: 'second.html', title: 'The best price' }
  ];
});
