import {
	Router as ExpressRouter,
	Request as ExpressRequest,
	Response as ExpressResponse,
	NextFunction as ExpressNextFunction,
} from 'express';

import { ObjectSanitizer } from 'valsan/object-sanitizer';

import { BaseApiRoute } from './base';
import { validateRequest } from './validation-middleware';
import { BadRequestError, HTTPError, UnprocessableEntityError } from '../error';

export type ApiRequest = ExpressRequest;
export type ApiResponse = ExpressResponse;
export type ApiNextFunction = ExpressNextFunction;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResponseData = { [key: string]: any } | { [key: string]: any }[];

export enum EndpointMethod {
	GET = 'get',
	POST = 'post',
	PUT = 'put',
	DELETE = 'delete',
	PATCH = 'patch',
}

export abstract class BaseApiEndpoint extends BaseApiRoute {
	override routeType = 'endpoint' as const;
	override path = '';
	public tag?: string;
	public method: EndpointMethod = EndpointMethod.GET;
	public statusCode: number = 200;

	public body?: ObjectSanitizer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public bodyExample?: any;

	public query?: ObjectSanitizer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public queryExample?: any;

	public params?: ObjectSanitizer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public paramsExample?: any;

	public headers?: ObjectSanitizer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public headersExample?: any;

	public response?: ObjectSanitizer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public responseExample?: any;

	public getErrors(): { [key: string]: HTTPError } {
		return {
			parse: new BadRequestError(),
			validation: new UnprocessableEntityError(),
		};
	}

	public getTag(): string {
		// Determine tag from router if available, fallback to class name
		return this.tag || this.constructor.name.replace(/Endpoint$/, '');
	}

	public override async register(
		parentRouter: ExpressRouter,
		parentPath: string
	): Promise<void> {
		if (!this.name) {
			this.name = this.constructor.name.replace(/Endpoint$/, '');
		}

		this.registerRoutePath(parentPath);

		// Collect middleware including authentication
		const endpointMiddleware = [...this.middleware];

		// Add authentication middleware based on effective authentication
		// This implements the cascading: endpoint → router → server
		const effectiveAuth = this.getEffectiveAuthentication();
		if (effectiveAuth) {
			endpointMiddleware.push(effectiveAuth.getMiddleware());
		}

		// Register with middleware (if any) before the handler
		if (endpointMiddleware.length > 0) {
			parentRouter[this.method](
				this.path,
				...endpointMiddleware,
				this.handleWrapper.bind(this)
			);
		}
		else {
			parentRouter[this.method](this.path, this.handleWrapper.bind(this));
		}
	}

	public async handleWrapper(
		request: ApiRequest,
		response: ApiResponse,
		next: ApiNextFunction
	): Promise<ApiResponseData> {
		await this.checkRequest(request);
		const data = await this.handle(request, response, next);

		response.status(this.statusCode);
		return response.send(data);
	}

	public abstract handle(
		request: ApiRequest,
		response: ApiResponse,
		next: ApiNextFunction
	): Promise<ApiResponseData>;

	public async checkRequest(request: ApiRequest): Promise<void> {
		// Validate request parts (body, query, params, headers)
		// 	if sanitizers are present
		await validateRequest(this, request);
	}
}

export type ApiEndpoint = { new (): BaseApiEndpoint };
