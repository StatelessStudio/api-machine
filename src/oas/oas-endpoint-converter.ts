import { ObjectSanitizer, ObjectValSan } from 'valsan';
import {
	PathItemObject,
	ParameterObject,
	RequestBodyObject,
	ResponsesObject,
} from 'auto-oas/oas/v3.1';

import { BaseApiEndpoint } from '../router';
import { buildParameter } from 'auto-oas/auto-oas';
import { AuthenticationScheme } from '../authentication/authentication-scheme';

/**
 * Returns OpenAPI path item for an endpoint,
 * 	based on validation.
 */
export class OasEndpointConverter {
	protected parameters: ParameterObject[] = [];

	public getOpenApiPath(
		endpoint: BaseApiEndpoint,
		authentication?: AuthenticationScheme | null
	): PathItemObject {
		this.addParams({
			location: 'path',
			sanitizer: endpoint.params,
			example: endpoint.paramsExample,
		});

		this.addParams({
			location: 'query',
			sanitizer: endpoint.query,
			example: endpoint.queryExample,
		});

		this.addParams({
			location: 'header',
			sanitizer: endpoint.headers,
			example: endpoint.headersExample,
		});

		let requestBody: RequestBodyObject | undefined = undefined;
		const bodySanitizer = endpoint.body;

		if (bodySanitizer && bodySanitizer.schema) {
			requestBody = {
				required: true,
				content: {
					'application/json': {
						schema: {
							$ref:
								'#/components/schemas/' +
								endpoint.getName() +
								'Body',
						},
					},
				},
			};
		}

		// Use statusCode for response
		const status = endpoint.statusCode;

		const responses: ResponsesObject = {};

		// Generate success response with schema if available
		const responseSanitizer = endpoint.response;
		if (responseSanitizer && responseSanitizer.schema) {
			responses[status] = {
				description: 'Success',
				content: {
					'application/json': {
						schema: {
							$ref:
								'#/components/schemas/' +
								endpoint.getName() +
								'Response',
						},
					},
				},
			};
		}
		else {
			responses[status] = { description: 'Success' };
		}

		const errors = endpoint.getErrors();
		for (const error in errors) {
			const httpError = errors[error];
			responses[httpError.getStatusCode()] = {
				description: httpError.message || 'Error response',
			};
		}

		// Add security requirement if authentication is present
		// null means explicitly public (no auth),
		// undefined inherited from parent
		const security =
			authentication !== undefined && authentication !== null
				? [authentication.getSecurityRequirement()]
				: authentication === null
					? []
					: undefined;

		return {
			[endpoint.method]: <PathItemObject>{
				summary: endpoint.getName(),
				description: endpoint.description,
				tags: [endpoint.getTag()],
				parameters:
					this.parameters.length > 0 ? this.parameters : undefined,
				requestBody,
				responses,
				security,
			},
		};
	}

	protected addParams({
		location,
		sanitizer,
		example,
	}: {
		location: 'path' | 'query' | 'header';
		sanitizer?: ObjectSanitizer | ObjectValSan;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		example?: any;
	}) {
		if (sanitizer && sanitizer.schema) {
			for (const key in sanitizer.schema) {
				const valSan = sanitizer.schema[key];
				const param = buildParameter(key, valSan, location);

				if (example && example[key] !== undefined) {
					param.example = example[key];
				}

				this.parameters.push(param);
			}
		}
	}
}
