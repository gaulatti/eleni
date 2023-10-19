import {
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { exec as originalExec } from 'child_process';
import { Readable } from 'stream';
import { ArticleStatus, getDbInstance } from '../utils/dal';
import fs = require('fs');
import os = require('os');
const db = getDbInstance();
const client = new S3Client();

function streamToFile(stream: Readable, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filename);
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

async function uploadFileToS3(bucket: string, key: string, filePath: string) {
  const fileStream = fs.createReadStream(filePath);
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
  const {
    titleOutput: { SynthesisTask: titleTask },
    paragraphsOutput,
    uuid,
    language,
  } = event;
  try {
    const bucketName = 'debrastack-articlestospeechbucket802d2e55-507ica0b9b8p';

    const { OutputUri: titleUri } = titleTask;

    const inputFiles = [
      titleUri.replace(
        'https://s3.us-east-1.amazonaws.com/debrastack-articlestospeechbucket802d2e55-507ica0b9b8p/',
        ''
      ),
    ];

    console.log('pre-para', { inputFiles });

    paragraphsOutput.forEach(
      (paragraph: {
        audioOutput: { SynthesisTask: { OutputUri: string } };
      }) => {
        inputFiles.push(
          paragraph.audioOutput.SynthesisTask.OutputUri.replace(
            'https://s3.us-east-1.amazonaws.com/debrastack-articlestospeechbucket802d2e55-507ica0b9b8p/',
            ''
          )
        );
      }
    );

    console.log('post-para', { inputFiles });
    const localUrls = inputFiles.map((url: string) => {
      const splitUrl = url.split('/');
      return `${os.tmpdir()}/${splitUrl[splitUrl.length - 1]}`;
    });

    console.log('post-para', { localUrls });

    const tmpOutputFile = `${os.tmpdir()}/output.mp3`;
    const outputFile = `full/${uuid}-${language}.mp3`;

    console.log({ tmpOutputFile, outputFile });

    for (let i in inputFiles) {
      const input = {
        Bucket: bucketName,
        Key: inputFiles[i],
      };
      console.log({ input });
      const getObjectRequest = new GetObjectCommand(input);
      const response: GetObjectCommandOutput = await client.send(
        getObjectRequest
      );

      if (!response.Body) {
        throw new Error('Failed to retrieve object body.');
      }
      console.log('file successfully obtained');
      await streamToFile(response.Body as Readable, localUrls[i]);
      console.log('file successfully saved');
    }

    const fileListPath = '/tmp/filelist.txt';
    const fileContent = localUrls.map((path) => `file '${path}'`).join('\n');

    fs.writeFileSync(fileListPath, fileContent);

    const command = `ffmpeg -f concat -safe 0 -i ${fileListPath} -c copy ${tmpOutputFile}`;
    await exec(command);

    await uploadFileToS3(bucketName, outputFile, tmpOutputFile);
    const article = await db.get(uuid);
    const outputs = article?.outputs || {};

    outputs[language] = {
      url: `https://debrastack-articlestospeechbucket802d2e55-507ica0b9b8p.s3.amazonaws.com/full/${uuid}-${language}.mp3`,
    };
    console.log('predb update')
    await db.updateRendered(uuid, outputs);
    console.log('postdb update')
  } catch (error) {
    await db.updateStatus(uuid, ArticleStatus.FAILED);
    throw error;
  }
  console.log('returning')
  return event;
};

export { main };
