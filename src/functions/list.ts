import { getDbInstance } from '../utils/dal';

const db = getDbInstance();

const main = async (_event: any, _context: any, callback: any) => {
  const list = await db.list();

  return {
    statusCode: 200,
    body: JSON.stringify(list),
  };
};

export { main };
