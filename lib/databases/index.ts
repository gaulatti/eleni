import { Stack } from 'aws-cdk-lib';
import { buildContentTable } from './content';
import { buildTasksTable } from './tasks';

/**
 * Builds the databases for the given stack.
 *
 * @param stack - The stack object.
 * @returns An object containing the built contentTable and tasksTable.
 */
const buildDatabases = (stack: Stack) => {
  const contentTable = buildContentTable(stack);
  const tasksTable = buildTasksTable(stack);

  return {
    contentTable,
    tasksTable,
  };
};

export { buildDatabases };
