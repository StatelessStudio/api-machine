import { BaseApiEndpoint, EndpointMethod } from '../endpoint';

export abstract class DeleteEndpoint extends BaseApiEndpoint {
	override method = EndpointMethod.DELETE;
	override statusCode = 204;
}
