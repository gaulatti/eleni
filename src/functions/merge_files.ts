import {
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { SFNClient, SendTaskFailureCommand, SendTaskSuccessCommand } from '@aws-sdk/client-sfn';
import { exec as originalExec } from 'child_process';
import { createReadStream, createWriteStream, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { ArticleStatus, getArticlesTableInstance } from '../utils/dal/articles';

const stepFunctionsClient = new SFNClient({});
const db = getArticlesTableInstance();
const client = new S3Client();
const BUCKET_URL = `https://s3.us-east-1.amazonaws.com/${process.env.BUCKET_NAME}/`;

function streamToFile(stream: Readable, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = createWriteStream(filename);
    stream.pipe(fileStream);
    stream.on('error', reject);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

function exec(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    originalExec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function fetchFromS3(bucket: string, key: string): Promise<Readable> {
  const getObjectRequest = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response: GetObjectCommandOutput = await client.send(getObjectRequest);

  if (!response.Body) throw new Error('Failed to retrieve object body.');

  return response.Body as Readable;
}

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
  await exec(command);
}

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

const main = async (event: any, _context: any, callback: any) => {
  const { title, text = [], uuid, language, token } = event;

  try {
    const inputFiles = [title.replace(BUCKET_URL, '')];
    inputFiles.push(...text.map((p: any) => p.url.replace(BUCKET_URL, '')));

    const tmpOutputFile = `${tmpdir()}/output.mp3`;
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
    await db.updateStatus(uuid, ArticleStatus.FAILED);
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
