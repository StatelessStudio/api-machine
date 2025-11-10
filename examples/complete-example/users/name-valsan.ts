import { TrimSanitizer, ComposedValSan, LengthValidator } from 'valsan';

export class NameValSan extends ComposedValSan<string, string> {
	constructor() {
		super([
			new TrimSanitizer(),
			new LengthValidator({ minLength: 1, maxLength: 50 }),
		]);
	}
}
