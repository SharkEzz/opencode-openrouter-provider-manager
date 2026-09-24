import { Plugin } from '@opencode/plugin';
import { setupPlugin } from './src/setup.ts';

export default Plugin.define({ id: 'openrouter-provider-manager', setup: setupPlugin });
