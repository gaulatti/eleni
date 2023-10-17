import {
  AudioCodec,
  ContainerType,
  CreateJobCommand,
  JobSettings,
  MediaConvertClient,
  Mp3RateControlMode,
  OutputGroupType,
} from '@aws-sdk/client-mediaconvert';
import { getDbInstance } from '../utils/dal';
import { languageMappings } from '../utils/languageMappings';

const client = new MediaConvertClient({
  endpoint: 'https://q25wbt2lc.mediaconvert.us-east-1.amazonaws.com',
});

const db = getDbInstance();

const main = async (event: any, _context: any, callback: any) => {
  const {
    uuid,
    language,
    titleOutput: {
      SynthesisTask: { OutputUri: titleUrl },
    },
    paragraphsOutput,
  } = event;

  /**
   * Do we want to insert an intro ad here?
   */
  const audioFiles = [titleUrl];

  for (const paragraphOutput of paragraphsOutput) {
    audioFiles.push(paragraphOutput.audioOutput.SynthesisTask.OutputUri);
  }

  /**
   * Do we want to insert an outro ad here?
   */
  const inputFiles = audioFiles.map((fileKey) => ({
    AudioSelectors: {
      'Audio Selector 1': {
        Offset: 0,
        DefaultSelection: 'DEFAULT',
        SelectorType: 'LANGUAGE_CODE',
        ProgramSelection: 1,
        LanguageCode: 'ENM',
      },
    },
    FileInput: fileKey,
  }));

  const jobSettings: JobSettings = {
    /* Replace with your MediaConvert job settings */
    Inputs: inputFiles,
    OutputGroups: [
      {
        Name: 'File Group',
        OutputGroupSettings: {
          Type: OutputGroupType.FILE_GROUP_SETTINGS,
          FileGroupSettings: {
            Destination: `s3://${process.env.BUCKET_NAME}/full/${uuid}-${language}`,
          },
        },
        Outputs: [
          {
            ContainerSettings: {
              Container: ContainerType.RAW,
            },
            AudioDescriptions: [
              {
                AudioTypeControl: 'FOLLOW_INPUT',
                CodecSettings: {
                  Codec: AudioCodec.MP3,
                  Mp3Settings: {
                    Bitrate: 32000,
                    Channels: 2,
                    SampleRate: 22050,
                    RateControlMode: Mp3RateControlMode.CBR,
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const audioUrl = `https://s3.us-east-1.amazonaws.com/${process.env.BUCKET_NAME}/full/${uuid}.mp3`

  const command = new CreateJobCommand({
    Settings: jobSettings,
    Role: process.env.MEDIA_CONVERT_ROLE_ARN,
  });

  const output = await client.send(command);
  await db.createMergeJob(output.Job?.Id!, uuid, audioUrl, language);

  return callback(null, {});
};

export { main };
