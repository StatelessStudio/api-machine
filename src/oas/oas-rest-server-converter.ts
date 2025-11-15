import {
	ComponentsObject,
	InfoObject,
	OpenAPIObject,
	PathItemObject,
	TagObject,
} from 'auto-oas/oas/v3.1';
import { RestServer } from '../server';
import { BaseApiEndpoint, BaseApiRouter } from '../router';
import { OasEndpointConverter } from './oas-endpoint-converter';
// eslint-disable-next-line max-len
import { OasEndpointComponentConverter } from './oas-endpoint-component-converter';

export class OasRestServerConverter {
	protected paths: Record<string, PathItemObject> = {};
	protected components: ComponentsObject = {};
	protected tags: TagObject[] = [];

	public async getOpenApiSpec(server: RestServer): Promise<OpenAPIObject> {
		await this.convertRouter(server.routerInstance);

		return {
			openapi: '3.1.0',
			info: await this.getOpenApiInfo(server),
			servers: [],
			paths: this.paths,
			components: this.components,
			security: [],
			tags: this.tags,
		};
	}

	public async getOpenApiInfo(server: RestServer): Promise<InfoObject> {
		return {
			title: server.name,
			version: server.version,
			description: server.description,
		};
	}

	public async convertRouter(router: BaseApiRouter) {
		for (const route of router.registeredRoutes) {
			if (route instanceof BaseApiEndpoint) {
				await this.convertEndpoint(route);
			}
			else if (route instanceof BaseApiRouter) {
				await this.convertRouter(route);
			}
		}
	}

	public async convertEndpoint(endpoint: BaseApiEndpoint) {
		const endpointConverter = new OasEndpointConverter();
		const pathItem = endpointConverter.getOpenApiPath(endpoint);
		const path = endpoint.fullPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

		if (this.paths[path] === undefined) {
			this.paths[path] = {};
		}

		Object.assign(this.paths[path], pathItem);

		const endpointComponentConverter = new OasEndpointComponentConverter();
		const endpointComponents =
			endpointComponentConverter.getSchemas(endpoint);

		if (!this.components.schemas) {
			this.components.schemas = {};
		}

		Object.assign(this.components.schemas, endpointComponents);
	}
}
