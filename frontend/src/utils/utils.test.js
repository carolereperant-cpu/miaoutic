// Unit tests of the utilities (format, password, form errors)
import { describe, test, expect } from 'vitest';
import { slugify, speciesEmoji, formatDate, countAnimals, sheetDescription } from './format';
import { isPasswordValid, PASSWORD_RULES } from './password';
import { fieldErrors } from './formErrors';

describe('slugify', () => {
  test.each([
    ['Chats', 'chats'],
    ['Épagneul breton', 'epagneul-breton'],
    ["Cochon d'Inde", 'cochon-d-inde'],
    ['  Rongeurs  ', 'rongeurs'],
  ])('%s -> %s', (text, expected) => {
    expect(slugify(text)).toBe(expected);
  });
});

test('speciesEmoji: known species, then default paw', () => {
  expect(speciesEmoji('Chats')).toBe('🐱');
  expect(speciesEmoji('Chiens')).toBe('🐶');
  expect(speciesEmoji('Dragons')).toBe('🐾');
});

test('formatDate never shifts by one day', () => {
  expect(formatDate('2026-06-03')).toBe('3 juin 2026');
  expect(formatDate('2026-01-01')).toBe('1 janvier 2026');
  expect(formatDate(null)).toBe('');
});

test('countAnimals uses the singular and the plural', () => {
  expect(countAnimals(0)).toBe('0 animal trouvé');
  expect(countAnimals(1)).toBe('1 animal trouvé');
  expect(countAnimals(12)).toBe('12 animaux trouvés');
});

describe('Password rules (same as the API)', () => {
  test('a strong password respects the 5 rules', () => {
    expect(isPasswordValid('Chaton#Roux2026')).toBe(true);
  });

  test.each([
    ['too short', 'Court#1a'],
    ['no upper case', 'chaton#roux2026'],
    ['no lower case', 'CHATON#ROUX2026'],
    ['no digit', 'Chaton#RouxRoux'],
    ['no special character', 'ChatonRoux2026'],
  ])('refused: %s', (_label, value) => {
    expect(isPasswordValid(value)).toBe(false);
  });

  test('there are 5 rules', () => {
    expect(PASSWORD_RULES).toHaveLength(5);
  });
});

test('fieldErrors keeps the first message of each field', () => {
  const error = {
    erreurs: [
      { champ: 'email', message: 'Email invalide.' },
      { champ: 'motDePasse', message: 'Trop court.' },
      { champ: 'motDePasse', message: 'Pas de chiffre.' },
    ],
  };
  expect(fieldErrors(error)).toEqual({ email: 'Email invalide.', motDePasse: 'Trop court.' });
  expect(fieldErrors(new Error('network'))).toEqual({});
});

describe('sheetDescription (SEO)', () => {
  const ROCKET = { nom: 'Rocket', nom_race: 'Berger australien', sexe: 'male', age: { libelle: '3 ans' } };

  test('short description: kept whole', () => {
    expect(sheetDescription({ ...ROCKET, description: 'Très joueur.' }))
      .toBe('Rocket, berger australien mâle de 3 ans, à adopter au refuge Les Pattes Unies. Très joueur.');
  });

  test('long description: at most 155 characters, cut at the end of a word', () => {
    const text = sheetDescription({ ...ROCKET, description: 'Adore courir dans le jardin. '.repeat(20) });
    expect(text.length).toBeLessThanOrEqual(155);
    expect(text).toMatch(/[a-zé.]…$/);
  });
});
