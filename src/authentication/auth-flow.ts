import { ApiEndpoint } from '../router';

/**
 * A named collection of authentication steps
 * Each step is identified by a key
 * (e.g., 'challenge', 'authorization', 'tokenExchange')
 *
 * Steps are classes extending BaseApiEndpoint
 * This allows each step to use endpoint features like validation and middleware
 *
 * The flow represents the entire authentication process
 * Steps are executed in the order they're defined
 */
export type AuthFlow = Record<string, ApiEndpoint>;
