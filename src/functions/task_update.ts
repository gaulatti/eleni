import { TaskStatus, getDbInstance } from '../utils/dal/tasks';
import { delay } from '../utils';
const db = getDbInstance();

const main = async (event: any, _context: any, callback: any) => {
  console.log(JSON.stringify(event.detail.responseElements.synthesisTask))
  // const { detail: { responseElements: { SynthesisTask: { TaskId } } } } = event;


  // await db.updateStatus(TaskId, TaskStatus.DELIVERED);
};

export { main };
