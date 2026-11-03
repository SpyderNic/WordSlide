// Add each story here as it's built.
const built = ["01-level-validator","03-place-a-letter","04-return-a-letter","05-recall-all","06-check-and-lock-a-word","17-pool-as-a-keyboard","11-next-level-and-progress","16-visual-style","21-reordering-taught-later","14-level-generator"];

export default {
  paths: ['tests/logic/*.feature', ...built.map((story) => `features/story-${story}.feature`)],
  import: ['tests/logic/steps/*.ts'],
  tags: 'not @browser',
  format: ['progress', 'html:reports/logic.html'],
};
