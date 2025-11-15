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
			example: endpoint.paramsExample,
		});

		this.addParams({
			location: 'query',
			sanitizer: endpoint.getQuerySanitizer(),
			example: endpoint.queryExample,
		});

		this.addParams({
			location: 'header',
			sanitizer: endpoint.getHeadersSanitizer(),
			example: endpoint.headersExample,
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
			[endpoint.method]: <PathItemObject>{
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
		example,
	}: {
		location: 'path' | 'query' | 'header';
		sanitizer?: ObjectSanitizer;
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
