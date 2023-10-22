import { TaskStatus, getDbInstance } from '../utils/dal/tasks';
import { delay } from '../utils';
const db = getDbInstance();
const main = async (event: any, _context: any, callback: any) => {
  const {
    audioOutput: {
      SynthesisTask: { TaskId },
    },
  } = event;

  let item = await db.get(TaskId);
  if (!item) {
    item = await db.create(TaskId);
  }

  while (item?.status !== TaskStatus.DELIVERED) {
    await delay(1000);
    item = await db.get(TaskId);
  }

  console.log(item)
  return event
};

export { main };
