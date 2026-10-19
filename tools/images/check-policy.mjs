import { checkProducer } from './workflow-policy.mjs';

try {
  checkProducer();
  console.log('UX image recipe, context and publication policy agree.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
