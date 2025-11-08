import { BaseApiEndpoint, EndpointMethod } from '../endpoint';

export abstract class GetEndpoint extends BaseApiEndpoint {
	override method = EndpointMethod.GET;
	override statusCode = 200;
}
