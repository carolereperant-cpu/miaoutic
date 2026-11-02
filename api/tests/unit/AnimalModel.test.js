// Unit and SECURITY tests of models/AnimalModel.js
// The connection pool is replaced by a mock: we check the SQL
// sent to MySQL without any database.
jest.mock('../../config/database', () => ({ execute: jest.fn() }));

const pool = require('../../config/database');
const AnimalModel = require('../../models/AnimalModel');

beforeEach(() => {
  pool.execute.mockReset();
  pool.execute.mockResolvedValue([[]]);
});

describe('AnimalModel.findPublic', () => {
  test('only shows available or reserved animals', async () => {
    await AnimalModel.findPublic();
    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain("a.statut IN ('disponible', 'reserve')");
    expect(params).toEqual([]);
  });

  test('adds one placeholder per filter, in the right order', async () => {
    await AnimalModel.findPublic({ idEspece: 2, taille: 'petit', nom: 'bis' });
    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql.match(/\?/g)).toHaveLength(3);
    expect(params).toEqual([2, 'petit', '%bis%']);
  });

  test('SECURITY: a SQL injection attempt is sent as a value, never inside the SQL', async () => {
    const attack = "' OR '1'='1";
    await AnimalModel.findPublic({ nom: attack });
    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).not.toContain(attack);
    expect(params).toEqual([`%${attack}%`]);
  });

  test('SECURITY: LIKE wildcards typed by the user are escaped', async () => {
    await AnimalModel.findPublic({ nom: '50%_off' });
    const [, params] = pool.execute.mock.calls[0];
    expect(params).toEqual(['%50\\%\\_off%']);
  });
});

describe('AnimalModel.findById', () => {
  test('returns null when no row is found', async () => {
    expect(await AnimalModel.findById(999)).toBeNull();
  });

  test('returns the first row and uses a placeholder for the id', async () => {
    pool.execute.mockResolvedValue([[{ id_animal: 1, nom: 'Pépette' }]]);
    const animal = await AnimalModel.findById(1);
    expect(animal.nom).toBe('Pépette');
    expect(pool.execute.mock.calls[0][1]).toEqual([1]);
  });
});

describe('AnimalModel.findVaccinations', () => {
  test('returns the id of the vaccine (needed to edit the animal)', async () => {
    await AnimalModel.findVaccinations(1);
    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain('v.id_vaccin');
    expect(params).toEqual([1]);
  });
});
