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
		const bodySanitizer = endpoint.getBodySanitizer();

		if (bodySanitizer) {
			this.addSchema({
				name: `${endpoint.name}Body`,
				sanitizer: bodySanitizer,
			});
		}

		return this.schemas;
	}

	protected addSchema({
		name,
		sanitizer,
	}: {
		name: string;
		sanitizer: ObjectSanitizer;
	}) {
		const schema = buildObjectSchema(sanitizer);

		if (schema) {
			this.schemas[name] = schema;
		}
	}
}
