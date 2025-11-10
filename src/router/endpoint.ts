import {
	Router as ExpressRouter,
	Request as ExpressRequest,
	Response as ExpressResponse,
	NextFunction as ExpressNextFunction,
} from 'express';

import { ObjectSanitizer } from 'valsan/object-sanitizer';

import { BaseApiRoute } from './base';
import { validateRequest } from './validation-middleware';

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
	override path = '';
	public method: EndpointMethod = EndpointMethod.GET;
	public statusCode: number = 200;

	public static body?: ObjectSanitizer;
	public static query?: ObjectSanitizer;
	public static params?: ObjectSanitizer;
	public static headers?: ObjectSanitizer;

	public override async register(parentRouter: ExpressRouter): Promise<void> {
		parentRouter[this.method](this.path, this.handleWrapper.bind(this));
	}

	public async handleWrapper(
		request: ApiRequest,
		response: ApiResponse,
		next: ApiNextFunction
	): Promise<ApiResponseData> {
		// Validate request parts (body, query, params, headers)
		// 	if sanitizers are present
		await validateRequest(this, request);
		const data = await this.handle(request, response, next);

		return response.send(data);
	}

	public abstract handle(
		request: ApiRequest,
		response: ApiResponse,
		next: ApiNextFunction
	): Promise<ApiResponseData>;
}

export type ApiEndpoint = { new (): BaseApiEndpoint };
