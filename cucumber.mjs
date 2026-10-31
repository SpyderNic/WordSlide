export default {
  paths: ['tests/logic/*.feature', 'features/story-01-level-validator.feature'],
  import: ['tests/logic/steps/*.ts'],
  format: ['progress', 'html:reports/logic.html'],
};
