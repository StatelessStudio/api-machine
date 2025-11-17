import { ObjectSanitizer } from 'valsan';
import { SchemaObject } from 'auto-oas/oas/v3.1';

import { BaseApiEndpoint } from '../router';
import { buildObjectSchema } from 'auto-oas/auto-oas';

/**
 * Builds OpenAPI component schemas for an endpoint from valsans
 */
export class OasEndpointComponentConverter {
	protected schemas: Record<string, SchemaObject> = {};

	// Return a map of schema name -> SchemaObject for the endpoint
	public getSchemas(endpoint: BaseApiEndpoint): Record<string, SchemaObject> {
		const bodySanitizer = endpoint.body;

		if (bodySanitizer) {
			this.addSchema({
				name: `${endpoint.name}Body`,
				sanitizer: bodySanitizer,
				example: endpoint.bodyExample,
			});
		}

		const responseSanitizer = endpoint.response;

		if (responseSanitizer) {
			this.addSchema({
				name: `${endpoint.name}Response`,
				sanitizer: responseSanitizer,
				example: endpoint.responseExample,
			});
		}

		return this.schemas;
	}

	protected addSchema({
		name,
		sanitizer,
		example,
	}: {
		name: string;
		sanitizer: ObjectSanitizer;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		example?: any;
	}) {
		const schema = buildObjectSchema(sanitizer);

		if (schema) {
			if (example) {
				schema.example = example;
			}

			this.schemas[name] = schema;
		}
	}
}
