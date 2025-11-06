import 'jasmine';
import * as index from '../../src';

describe('ts-rest', () => {
	it('exports a', () => {
		expect(index.a).toBeTrue();
	});
});
