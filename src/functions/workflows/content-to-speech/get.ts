import {
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { createRequest } from '@aws-sdk/util-create-request';
import { formatUrl } from '@aws-sdk/util-format-url';
import { v4 as uuidv4 } from 'uuid';
import {
  checkLanguagesPresent,
  delay,
  extractPathWithTrailingSlash,
  lambdaHttpOutput,
  sanitizeGetInputs,
} from '../../../utils';
import { getContentTableInstance } from '../../../utils/dal/content';

const db = getContentTableInstance(process.env.TABLE_NAME!);
const client = new S3Client();
const presigner = new S3RequestPresigner(client.config);

function parseS3Url(url: string) {
  const match = url.match(/https:\/\/s3\..+\.amazonaws\.com\/([^\/]+)\/(.+)/);
  if (!match || match.length !== 3) {
    throw new Error('Invalid S3 URL');
  }
  return {
    Bucket: match[1],
    Key: decodeURIComponent(match[2]),
  };
}

const main = async (event: any, _context: any, callback: any) => {
  const { contentId, href, language } = event.args.input;
  if (!contentId && !href) throw new Error('Missing contentId or url');
  let existingItem, url, uuid;

  if (contentId) {
    existingItem = await db.get(contentId);
  }

  if (href) {
    url = extractPathWithTrailingSlash(href);
  }

  /**
   * If existingItem can't be found by UUID, try to find it by URL
   */
  if (!existingItem) {
    existingItem = await db.queryByUrl(url);
  }

  /**
   * If there's no existing item, create a new one
   */
  if (!existingItem) {
    /**
     * If there's no URL, return 404. We need the URL to crawl the page
     */
    if (!url) throw new Error('404');
    const createResponse = await db.create(uuidv4(), url);
    uuid = createResponse.uuid;
    console.log(`Created record for ${url}`);
    existingItem = await db.get(uuid);
  } else {
    uuid = existingItem.uuid;
  }

  /**
   * If we're only looking for one language, if
   * that language exists we can return the item.
   *
   * Otherwise, we wait until all languages are generated.
   */
  while (!checkLanguagesPresent(existingItem, language)) {
    await delay(1000);
    existingItem = await db.get(uuid);
  }
  if (existingItem) {
    const keys = Object.keys(existingItem['outputs']);
    const output: { code: string, url: string }[] = [];
    await Promise.all(
      keys.map(async (key) => {
        const { Bucket, Key } = parseS3Url(
          existingItem!['outputs'][key]['url']
        );

        const command = new GetObjectCommand({
          Bucket,
          Key,
        });

        const request = await createRequest<
          any,
          GetObjectCommandInput,
          GetObjectCommandOutput
        >(new S3Client({}), command);

        const signedUrl = formatUrl(
          await presigner.presign(request, { expiresIn: 3600 })
        );

        output.push({ code: key, url: signedUrl });
      })
    );
    existingItem['outputs'] = output;
  }

  callback(null, existingItem);
};

export { main };
