import { getTasksTableInstance } from '../utils/dal/tasks';

const db = getTasksTableInstance();

const main = async (event: any, _context: any, _callback: any) => {
  const { textType, title, token, audioOutput } = event;

  const source =
    textType === 'title'
      ? title
      : textType === 'paragraph'
      ? audioOutput
      : null;

  if (source) {
    const {
      SynthesisTask: { TaskId, OutputUri },
    } = source;

    const currentDate = new Date();
    currentDate.setSeconds(currentDate.getSeconds() + 500);
    const unixTimestamp = Math.floor(currentDate.getTime() / 1000);

    if (TaskId && OutputUri)
      await db.create(TaskId, OutputUri, token, unixTimestamp);
  }
};

export { main };
