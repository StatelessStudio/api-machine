import {
	ComponentsObject,
	InfoObject,
	OpenAPIObject,
	PathItemObject,
	SecuritySchemeObject,
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
	protected securitySchemes: Record<string, SecuritySchemeObject> = {};

	public async getOpenApiSpec(server: RestServer): Promise<OpenAPIObject> {
		await this.convertRouter(server.routerInstance);

		// Add collected security schemes to components
		if (Object.keys(this.securitySchemes).length > 0) {
			if (!this.components.securitySchemes) {
				this.components.securitySchemes = {};
			}
			Object.assign(
				this.components.securitySchemes,
				this.securitySchemes
			);
		}

		// Set global security if server has authentication
		const globalSecurity = [];
		if (server.authentication) {
			globalSecurity.push(server.authentication.getSecurityRequirement());
		}

		return {
			openapi: '3.1.0',
			info: await this.getOpenApiInfo(server),
			servers: [],
			paths: this.paths,
			components: this.components,
			security: globalSecurity,
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
		// Get effective authentication for this endpoint
		const effectiveAuth = endpoint.getEffectiveAuthentication();

		// Collect authentication scheme if present and not null
		// (null = public)
		if (effectiveAuth) {
			const schemeName = effectiveAuth.schemeName;
			if (!this.securitySchemes[schemeName]) {
				this.securitySchemes[schemeName] =
					effectiveAuth.getSecurityScheme();
			}
		}

		const endpointConverter = new OasEndpointConverter();
		const pathItem = endpointConverter.getOpenApiPath(
			endpoint,
			effectiveAuth
		);
		const path = (endpoint.fullPath || '/').replace(
			/:([a-zA-Z0-9_]+)/g,
			'{$1}'
		);

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
