import { ArticleStatus, getDbInstance } from '../utils/dal';

const db = getDbInstance();

const main = async (event: any, _context: any, callback: any) => {
  console.log(event)
  return callback(null, {});
};

export { main };
