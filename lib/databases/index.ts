import { Stack } from 'aws-cdk-lib';
import { buildContentTable } from './content';
import { buildTasksTable } from './tasks';

const buildDatabases = (stack: Stack) => {
  const contentTable = buildContentTable(stack);
  const tasksTable = buildTasksTable(stack);

  return {
    contentTable,
    tasksTable,
  };
};

export { buildDatabases };
