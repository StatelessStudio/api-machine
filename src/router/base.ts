import { Router as ExpressRouter, RequestHandler } from 'express';
import { AuthenticationScheme } from '../authentication/authentication-scheme';

export abstract class BaseApiRoute {
	public path: string;
	public fullPath: string;
	public name: string;
	public description?: string;

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

	/**
	 * Parent route in the hierarchy (used for authentication cascading)
	 * @internal
	 */
	// eslint-disable-next-line no-use-before-define
	public parentRoute?: BaseApiRoute;

	public abstract register(
		parentRouter: ExpressRouter,
		parentPath: string
	): Promise<void>;

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
		| AuthenticationScheme
		| undefined
		| null {
		// If explicitly set (including null for public routes), use it
		if (this.authentication !== undefined) {
			return this.authentication;
		}

		// Otherwise, cascade to parent
		if (this.parentRoute) {
			return this.parentRoute.getEffectiveAuthentication();
		}

		// No authentication at any level
		return undefined;
	}
}

export type ApiRoute = { new (): BaseApiRoute };
