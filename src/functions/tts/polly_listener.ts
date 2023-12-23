import { SFNClient, SendTaskSuccessCommand } from '@aws-sdk/client-sfn';
import { TaskStatus, getTasksTableInstance } from '../../utils/dal/tasks';

const client = new SFNClient({});
const db = getTasksTableInstance(process.env.TABLE_NAME!);

/**
 * Handles the main logic for the Polly listener.
 *
 * @param event - The event object containing the records.
 * @param _context - The context object.
 * @param callback - The callback function.
 */
const main = async (event: any, _context: any, callback: any) => {
  const { Records } = event;

  if (!Records && !Records.length) {
    return callback(null, 'No records found');
  }

  const items = Records.filter(
    ({ eventName }: any) => eventName === 'ObjectCreated:Put'
  ).map((item: any) => {
    const {
      s3: {
        bucket: { name },
        object: { key },
      },
    } = item;

    return `https://s3.us-east-1.amazonaws.com/${name}/${key}`;
  });

  const dbItems = await db.list();

  for (const item in items) {
    const dbItem = dbItems.find(({ url }) => url == items[item]);

    if (dbItem) {
      await db.updateStatus(dbItem.uuid, TaskStatus.DELIVERED);

      const input = {
        taskToken: dbItem.token,
        output: JSON.stringify({ url: dbItem.url }),
      };
      const command = new SendTaskSuccessCommand(input);
      const response = await client.send(command);
    }

    // if (!dbItem) {
    // console.error('[Listener] Item not found, creating');
    // }

    // console.log({dbItem});
  }

  // const { detail, resources, 'detail-type': detailType } = event;
  // console.log(JSON.stringify(event), detail, resources, detailType);

  //   import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn"; // ES Modules import
  // // const { SFNClient, SendTaskSuccessCommand } = require("@aws-sdk/client-sfn"); // CommonJS import
  // const client = new SFNClient(config);
  // const input = { // SendTaskSuccessInput
  //   taskToken: "STRING_VALUE", // required
  //   output: "STRING_VALUE", // required
  // };
  // const command = new SendTaskSuccessCommand(input);
  // const response = await client.send(command);
  // // {};

  // import { SFNClient, SendTaskFailureCommand } from "@aws-sdk/client-sfn"; // ES Modules import
  // // const { SFNClient, SendTaskFailureCommand } = require("@aws-sdk/client-sfn"); // CommonJS import
  // const client = new SFNClient(config);
  // const input = { // SendTaskFailureInput
  //   taskToken: "STRING_VALUE", // required
  //   error: "STRING_VALUE",
  //   cause: "STRING_VALUE",
  // };
  // const command = new SendTaskFailureCommand(input);
  // const response = await client.send(command);
  // // {};
};

export { main };
