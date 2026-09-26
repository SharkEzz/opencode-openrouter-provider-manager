import type { Workload } from '../config.ts';
import { agentic } from './agentic.ts';
import { bigContext } from './big-context.ts';
import type { WorkloadSpec } from './common.ts';
import { long } from './long.ts';
import { short } from './short.ts';

export * from './common.ts';
export { agentic, bigContext, long, short };

export const SPECS: Record<Workload, WorkloadSpec> = {
  short: short.spec,
  long: long.spec,
  agentic: agentic.spec,
  'big-context': bigContext.spec,
};
