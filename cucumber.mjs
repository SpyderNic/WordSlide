// Add each story here as it's built.
const built = ["m02-01-level-validator","m03-01-place-a-letter","m03-02-return-a-letter","m03-03-recall-all","m03-04-check-and-lock-a-word","m03-05-pool-as-a-keyboard","m05-01-next-level-and-progress","m05-02-visual-style","m05-04-reordering-taught-later","m06-01-level-generator","m06-02-draft-the-first-levels","m07-03-buying-hints","m07-04-level-series","m07-05-bonus-words"];

export default {
  paths: ['tests/logic/*.feature', ...built.map((story) => `features/**/${story}.feature`)],
  import: ['tests/logic/steps/*.ts'],
  tags: 'not @browser and not @manual',
  format: ['progress', 'html:reports/logic.html'],
};
