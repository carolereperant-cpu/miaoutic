// Unit tests of utils/age.js
const { computeAge } = require('../../utils/age');

// Fixed reference date: the tests give the same result every day
const TODAY = new Date(2026, 10, 2); // 2 November 2026 (months start at 0)

describe('computeAge', () => {
  test('counts full years', () => {
    expect(computeAge('2023-03-01', TODAY)).toEqual({ annees: 3, mois: 8, libelle: '3 ans' });
  });

  test('uses the singular for 1 year', () => {
    expect(computeAge('2025-08-15', TODAY).libelle).toBe('1 an');
  });

  test('shows months when the animal is younger than 1 year', () => {
    expect(computeAge('2026-04-15', TODAY)).toEqual({ annees: 0, mois: 6, libelle: '6 mois' });
  });

  test('does not count a month that is not complete yet', () => {
    // Born on 3 October: on 2 November the first month is not complete
    expect(computeAge('2026-10-03', TODAY).libelle).toBe('Moins d\'un mois');
  });

  test('counts the birthday itself', () => {
    expect(computeAge('2016-11-02', TODAY)).toEqual({ annees: 10, mois: 0, libelle: '10 ans' });
  });

  test('never returns a negative age for a date in the future', () => {
    expect(computeAge('2027-01-01', TODAY)).toEqual({ annees: 0, mois: 0, libelle: 'Moins d\'un mois' });
  });
});
