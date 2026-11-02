import { describe, expect, it } from 'vitest';
import { samplePlan } from './sample';
import { checkPlan } from './rules';
import { parsePlan } from './schema';

describe('sample plan', () => {
  it('is a valid plan', () => {
    expect(parsePlan(samplePlan).ok).toBe(true);
  });

  it('shows no design issues, so first-time visitors start with a clean plan', () => {
    expect(checkPlan(samplePlan)).toEqual([]);
  });
});