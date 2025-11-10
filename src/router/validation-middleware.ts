import { ObjectSanitizer } from 'valsan';
import { ApiRequest, BaseApiEndpoint } from './endpoint';
import { UnprocessableEntityError } from '../error';

/**
 * Runs a valsan ObjectSanitizer on a value,
 *  throws with error details if validation fails.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runSanitizer(sanitizer: ObjectSanitizer, value: any) {
	const result = await sanitizer.run(value);

	if (!result.success) {
		throw new UnprocessableEntityError('Validation failed', {
			details: result.errors,
		});
	}

	return result.data;
}

/**
 * Validates and sanitizes request parts
 *  (body, query, params, headers) if the
 *  endpoint defines a static ObjectSanitizers
 */
export async function validateRequest(
	endpoint: BaseApiEndpoint,
	request: ApiRequest
): Promise<void> {
	for (const part of ['body', 'query', 'params', 'headers'] as const) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sanitizer = (endpoint.constructor as any)[part];

		if (sanitizer instanceof ObjectSanitizer) {
			request[part] = await runSanitizer(sanitizer, request[part]);
		}
	}
}
