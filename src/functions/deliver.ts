import { ArticleStatus, getDbInstance } from '../utils/dal';

const db = getDbInstance();

const main = async (event: any, _context: any, callback: any) => {
  const {
    detail: { jobId, status },
  } = event;

  const item = await db.get(jobId);

  if (!item || !item.article_id) {
    throw new Error(`Item with mergeId ${jobId} not found`);
  }

  const article = await db.get(item.article_id);
  const outputs = article?.outputs || {};

  outputs[item.language] = {
    status,
    jobId,
    url: item.url,
  };

  console.log(outputs)

  await db.updateRendered(item.article_id, outputs);


  if (status == 'ERROR') {
    await db.updateStatus(item.uuid, ArticleStatus.FAILED);
  }

  return callback(null, {});
};

export { main };
