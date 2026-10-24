import { Router as ExpressRouter, RequestHandler } from 'express';
import { AuthenticationScheme } from '../authentication/authentication-scheme';
import { DependencyContainer } from 'hidi';
import { AuthenticatedRequest } from '../authentication/authenticated-request';
import {
	ApiAuthorizationService,
	AuthorizationRequirement,
} from '../authorization';
import { LogInterface } from '../log';

export const AUTHENTICATION_KEY = 'api-machine.authn';
export const AUTHORIZATION_KEY = 'api-machine.authz';
export const AUTHORIZATION_REQUIREMENT_KEY =
	'api-machine.authorization-requirement';

export abstract class BaseApiRoute {
	public path: string;
	public fullPath: string;
	public name: string;
	public description?: string;
	public routeType: 'router' | 'endpoint';

	/**
	 * Dependency container for this route
	 */
	public container: DependencyContainer = new DependencyContainer();

	/**
	 * Optional array of Express middleware to apply
	 */
	public middleware: RequestHandler[] = [];

	/**
	 * Authentication scheme for this route
	 * Set to null to explicitly make a route public (no authentication)
	 * If undefined, inherits from parent router or server
	 */
	public authentication?: AuthenticationScheme | null;
	public authorizer?: ApiAuthorizationService | null;
	public authorization?: AuthorizationRequirement | null;

	/**
	 * Parent route in the hierarchy (used for authentication cascading)
	 * @internal
	 */
	// eslint-disable-next-line no-use-before-define
	public parentRoute?: BaseApiRoute;

	public async register(
		_parentRouter: ExpressRouter,
		_parentPath: string
	): Promise<void> {
		if (this.authentication !== undefined) {
			this.container.register(AUTHENTICATION_KEY, this.authentication);
		}

		if (this.authorizer !== undefined) {
			this.container.register(AUTHORIZATION_KEY, this.authorizer);
		}

		if (this.authorization !== undefined) {
			this.container.register(
				AUTHORIZATION_REQUIREMENT_KEY,
				this.authorization
			);
		}

		this.inject();
	}

	public inject(): void {
		// Override in subclasses to register dependencies
	}

	public getName(): string {
		return this.name || this.constructor.name;
	}

	public registerRoutePath(parentPath: string): void {
		if (!this.path) {
			this.path = '';
		}
		else if (!this.path.startsWith('/')) {
			this.path = '/' + this.path;
		}

		if (parentPath.endsWith('/')) {
			parentPath = parentPath.slice(0, -1);
		}

		this.fullPath = parentPath + this.path;
	}

	/**
	 * Get the effective authentication scheme for this route
	 * Implements cascading logic: endpoint → router → server
	 * @returns The authentication scheme to use, or undefined if public
	 */
	public getEffectiveAuthentication():
		AuthenticationScheme | undefined | null {
		let container: DependencyContainer | undefined = this.container;
		while (container) {
			// hidi exposes no public local-registration or parent lookup.
			if (container['dependencies'].has(AUTHENTICATION_KEY)) {
				const authentication =
					container.get<AuthenticationScheme | null>(
						AUTHENTICATION_KEY
					);
				if (authentication !== undefined) {
					return authentication;
				}
			}

			if (container['dependencies'].has('auth')) {
				const legacy = container.get<unknown>('auth');
				if (legacy === null || legacy instanceof AuthenticationScheme) {
					return legacy;
				}
			}

			container = container['parent'];
		}

		return undefined;
	}

	public getEffectiveAuthorizationService():
		ApiAuthorizationService | undefined | null {
		return this.container.get(AUTHORIZATION_KEY);
	}

	public getEffectiveAuthorizationRequirement():
		AuthorizationRequirement | undefined | null {
		return this.container.get(AUTHORIZATION_REQUIREMENT_KEY);
	}

	public logAuthorization(
		level: 'info' | 'warn' | 'error',
		event: string,
		request: AuthenticatedRequest,
		context: Record<string, unknown> = {}
	): void {
		const logger = this.container.get<LogInterface>('log');

		if (logger) {
			logger[level](event, {
				...context,
				principalId: request.principal?.id,
				method: request.method,
				path: request.originalUrl,
				requestId: request.headers?.['x-request-id'],
			});
		}
	}
}

export type ApiRoute = new (
	...params: ConstructorParameters<typeof BaseApiRoute>
) => BaseApiRoute;
