import {
	ArrayValSan,
	ObjectSanitizer,
	ObjectValSan,
	ObjectValSanOptions,
} from 'valsan';
import { ApiRequest, BaseApiEndpoint } from './endpoint';
import { UnprocessableEntityError } from '../error';

/**
 * Runs a valsan ObjectValSan on a value,
 *  throws with error details if validation fails.
 */
export async function runSanitizer(
	sanitizer: ObjectSanitizer | ObjectValSan | ArrayValSan,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any
) {
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
 *  endpoint defines an ObjectValSan
 */
export async function validateRequest(
	endpoint: BaseApiEndpoint,
	request: ApiRequest
): Promise<void> {
	for (const part of ['body', 'query', 'params', 'headers'] as const) {
		const sanitizer = endpoint[part];

		if (!sanitizer) {
			continue;
		}

		if (part === 'headers' && 'options' in sanitizer) {
			(
				sanitizer.options as ObjectValSanOptions
			).allowAdditionalProperties = true;
		}

		const sanitized = await runSanitizer(sanitizer, request[part]);

		if (part === 'query') {
			// Mutate the query object instead of reassigning
			Object.keys(request.query).forEach((key) => {
				delete request.query[key];
			});
			Object.assign(request.query, sanitized);
		}
		else {
			request[part] = sanitized;
		}
	}
}
