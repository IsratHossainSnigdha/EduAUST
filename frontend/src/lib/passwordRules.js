/*
 * The password rule the server enforces everywhere: registering, changing a
 * password and resetting one. Checked here as well so people see what is
 * missing while they type, rather than only after submitting.
 *
 * The character classes are Laravel's own (Password::mixedCase, numbers and
 * symbols use Unicode properties), so the two sides agree on every input.
 */
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => [...p].length >= 8 },
  { key: 'lower', label: 'A lowercase letter', test: (p) => /\p{Ll}/u.test(p) },
  { key: 'upper', label: 'An uppercase letter', test: (p) => /\p{Lu}/u.test(p) },
  { key: 'number', label: 'A number', test: (p) => /\p{N}/u.test(p) },
  { key: 'symbol', label: 'A symbol', test: (p) => /[\p{Z}\p{S}\p{P}]/u.test(p) },
];

/**
 * Which rules a password meets, and whether it meets all of them.
 */
export function checkPassword(password = '') {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));

  return { results, valid: results.every((r) => r.met) };
}
