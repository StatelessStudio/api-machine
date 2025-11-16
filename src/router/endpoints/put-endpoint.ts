import { BaseApiEndpoint, EndpointMethod } from '../endpoint';

export abstract class PutEndpoint extends BaseApiEndpoint {
	override method = EndpointMethod.PUT;
	override statusCode = 200;
}
