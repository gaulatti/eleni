import {
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  SFNClient,
  SendTaskFailureCommand,
  SendTaskSuccessCommand,
} from '@aws-sdk/client-sfn';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { ContentStatus, getContentTableInstance } from '../../utils/dal/content';

const stepFunctionsClient = new SFNClient({});
const db = getContentTableInstance(process.env.TABLE_NAME!);
const client = new S3Client();
const BUCKET_URL = `https://s3.us-east-1.amazonaws.com/${process.env.BUCKET_NAME}/`;

/**
 * Writes the contents of a readable stream to a file.
 * @param stream The readable stream to write.
 * @param filename The name of the file to write to.
 * @returns A promise that resolves when the stream has been written to the file, or rejects if an error occurs.
 */
function streamToFile(stream: Readable, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = createWriteStream(filename);
    stream.pipe(fileStream);
    stream.on('error', reject);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

/**
 * Executes a command synchronously and returns the stdout and stderr.
 * @param command The command to execute.
 * @returns An object containing the stdout and stderr.
 */
function exec(command: string): { stdout: string; stderr: string } {
  try {
    // Execute the command synchronously
    const stdout = execSync(command, { timeout: 10000 }).toString();
    return { stdout, stderr: '' };
  } catch (error: any) {
    console.error('Exec error:', error);
    if (error.stderr) {
      console.error('Exec stderr:', error.stderr.toString());
      return { stdout: '', stderr: error.stderr.toString() };
    }
    throw error;
  }
}

/**
 * Fetches an object from an S3 bucket.
 * @param bucket - The name of the S3 bucket.
 * @param key - The key of the object to fetch.
 * @returns A promise that resolves to a Readable stream representing the object body.
 * @throws An error if the object body cannot be retrieved.
 */
async function fetchFromS3(bucket: string, key: string): Promise<Readable> {
  const getObjectRequest = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response: GetObjectCommandOutput = await client.send(getObjectRequest);

  if (!response.Body) throw new Error('Failed to retrieve object body.');

  return response.Body as Readable;
}

/**
 * Concatenates multiple audio files into a single output file.
 *
 * @param inputFiles - An array of input file paths.
 * @param outputFile - The path of the output file.
 * @returns A Promise that resolves when the audio files are successfully concatenated.
 */
async function concatenateAudioFiles(inputFiles: string[], outputFile: string) {
  const localUrls = inputFiles.map(
    (url) => `${tmpdir()}/${url.split('/').pop()}`
  );

  for (let i in inputFiles) {
    const audioStream = await fetchFromS3(
      process.env.BUCKET_NAME!,
      inputFiles[i]
    );
    await streamToFile(audioStream, localUrls[i]);
  }

  const fileListPath = '/tmp/filelist.txt';
  const fileContent = localUrls.map((path) => `file '${path}'`).join('\n');
  writeFileSync(fileListPath, fileContent);

  console.log('filelist', fileListPath);
  const command = `ffmpeg -f concat -safe 0 -i ${fileListPath} -c copy ${outputFile}`;
  console.log('Executing ffmpeg command...');
  try {
    const { stdout, stderr } = exec(command);
    console.log({ stdout, stderr });
  } catch (error) {
    console.error('Error executing ffmpeg command:', error);
  }
  console.log('ffmpeg command exited');
}

/**
 * Uploads a file to an S3 bucket.
 *
 * @param bucket - The name of the S3 bucket.
 * @param key - The key under which the file will be stored in the bucket.
 * @param filePath - The path to the file to be uploaded.
 * @returns A promise that resolves when the file is successfully uploaded.
 */
async function uploadFileToS3(bucket: string, key: string, filePath: string) {
  const fileStream = createReadStream(filePath);
  const client = new S3Client({ region: 'us-east-1' });

  const input = {
    Bucket: bucket,
    Key: key,
    Body: fileStream,
  };

  const command = new PutObjectCommand(input);
  await client.send(command);
}

/**
 * Main function for merging audio files and uploading the result to S3.
 *
 * @param event - The event object containing the necessary data for merging files.
 * @param _context - The context object.
 * @param callback - The callback function to be called after the merging process is complete.
 * @returns The event object.
 */
const main = async (event: any, _context: any, callback: any) => {
  const { title, text = [], uuid, language, token } = event;
  console.log(JSON.stringify(event));

  try {
    const inputFiles = [title.replace(BUCKET_URL, '')];
    inputFiles.push(...text.map((p: any) => p.url.replace(BUCKET_URL, '')));

    const tmpOutputFile = `${tmpdir()}/${uuid}-${language}.mp3`;
    const outputFile = `full/${uuid}-${language}.mp3`;

    await concatenateAudioFiles(inputFiles, tmpOutputFile);
    await uploadFileToS3(process.env.BUCKET_NAME!, outputFile, tmpOutputFile);
    const article = await db.get(uuid);
    const outputs = article?.outputs || {};
    outputs[language] = { url: `${BUCKET_URL}${outputFile}` };

    await db.updateRendered(uuid, outputs);
    const input = {
      taskToken: token,
      output: JSON.stringify({ uuid, outputs }),
    };
    const command = new SendTaskSuccessCommand(input);
    const response = await stepFunctionsClient.send(command);
  } catch (error) {
    await db.updateStatus(uuid, ContentStatus.FAILED);
    const input = {
      taskToken: token,
      output: JSON.stringify({ uuid }),
    };
    const command = new SendTaskFailureCommand(input);
    const response = await stepFunctionsClient.send(command);
  }

  callback(null, event);
  return event;
};

export { main };
