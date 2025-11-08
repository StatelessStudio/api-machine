import { BaseApiEndpoint, EndpointMethod } from '../endpoint';

export abstract class PostEndpoint extends BaseApiEndpoint {
	override method = EndpointMethod.POST;
	override statusCode = 201;
}
