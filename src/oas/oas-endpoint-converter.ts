import { ObjectSanitizer } from 'valsan';
import {
	PathItemObject,
	ParameterObject,
	RequestBodyObject,
} from 'auto-oas/oas/v3.1';

import { BaseApiEndpoint } from '../router';
import { buildParameter } from 'auto-oas/auto-oas';

/**
 * Returns OpenAPI path item for an endpoint,
 * 	based on validation.
 */
export class OasEndpointConverter {
	protected parameters: ParameterObject[] = [];

	public getOpenApiPath(endpoint: BaseApiEndpoint): PathItemObject {
		this.addParams({
			location: 'path',
			sanitizer: endpoint.getParamsSanitizer(),
		});

		this.addParams({
			location: 'query',
			sanitizer: endpoint.getQuerySanitizer(),
		});

		this.addParams({
			location: 'header',
			sanitizer: endpoint.getHeadersSanitizer(),
		});

		let requestBody: RequestBodyObject | undefined = undefined;
		const bodySanitizer = endpoint.getBodySanitizer();

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

		return {
			[endpoint.method]: {
				summary: endpoint.getName(),
				description: endpoint.description,
				tags: [endpoint.getTag()],
				parameters:
					this.parameters.length > 0 ? this.parameters : undefined,
				requestBody,
				responses: {
					[status]: {
						description: 'Successful response',
					},
				},
			},
		};
	}

	protected addParams({
		location,
		sanitizer,
	}: {
		location: 'path' | 'query' | 'header';
		sanitizer?: ObjectSanitizer;
	}) {
		if (sanitizer && sanitizer.schema) {
			for (const key in sanitizer.schema) {
				const valSan = sanitizer.schema[key];
				const param = buildParameter(key, valSan, location);

				this.parameters.push(param);
			}
		}
	}
}
