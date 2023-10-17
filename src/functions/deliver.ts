import { ArticleStatus, getDbInstance } from '../utils/dal';

const db = getDbInstance();

const main = async (event: any, _context: any, callback: any) => {
  const {
    detail: { jobId, status },
  } = event;

  const items = (await db.list()) || [];
  const item = items.find((item) => item.mergeId === jobId);

  if (!item) {
    throw new Error(`Item with mergeId ${jobId} not found`);
  }

  if (status !== 'ERROR') {
    await db.updateStatus(item.uuid, ArticleStatus.DELIVERED);
  } else {
    await db.updateStatus(item.uuid, ArticleStatus.FAILED);
  }

  return callback(null, {});
};

export { main };
