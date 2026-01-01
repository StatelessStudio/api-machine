import { AuthStep } from './auth-step';

/**
 * A named collection of authentication steps
 * Each step is identified by a key
 *  (e.g., 'challenge', 'authorization', 'tokenExchange')
 *
 * The flow represents the entire authentication process
 * Steps are executed in the order they're defined
 */
export type AuthFlow = Record<string, AuthStep>;
