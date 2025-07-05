import fs from 'fs';
import OpenAI from 'openai';
import { OPENAI_OPTIONS } from './constants';
import { OpenAIOptions } from './interfaces';
import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import path from 'path';
import {} from 'openai/resources/beta/threads/threads';
import openai from 'openai';
import { TitleDeedSchema } from './interfaces/openai-title-deed-schema.interface';

@Injectable()
export class OpenAIService {
  private readonly _client: OpenAI;

  constructor(
    @Inject(OPENAI_OPTIONS)
    private readonly options: OpenAIOptions,
  ) {
    this._client = new OpenAI({
      apiKey: this.options.apiKey,
    });
  }

  /**
   * Converts a buffer to a readable file stream.
   * @param {Buffer} buffer - The buffer containing the file content.
   * @param {string} fileName - The name of the temporary file.
   * @returns {fs.ReadStream} - The readable file stream.
   */
  bufferToFileStream(buffer: Buffer, fileName: string) {
    // Define a temporary file path
    const tempFilePath = path.join(__dirname, fileName);

    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, buffer);

    // Create a readable file stream from the temporary file
    const fileStream = fs.createReadStream(tempFilePath);

    // Clean up the temporary file after the stream is closed
    fileStream.on('close', () => {
      fs.unlinkSync(tempFilePath);
    });

    return fileStream;
  }

  bufferToBase64(buffer: Buffer, fileName: string) {
    // Define a temporary file path
    const tempFilePath = path.join(__dirname, fileName);

    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, buffer);

    return fs.readFileSync(tempFilePath, { encoding: 'base64' });
  }

  async titleDeedAnalysis(image: {
    image: string;
    format: string;
    mime_type: string;
  }): Promise<TitleDeedSchema | null> {
    const response = await this._client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
            You are a govermental official specialized in real estate with over 20 years of experience. 
            Your task is to analyze a title deed property document and extract all the property information.
            Return the information in a JSON structured format.
            Any information that doesn't fit into the JSON structure should be added to the additional_info field.
            
            Here is the example of the JSON structure:
            {
              "documentType": "Title Deed",
              "propertyType": "Flat",
              "community": "Al Barsha South Fourth",
              "buildingName": "Binghatti Rose",
              "buildingNumber": "1",
              "plotNumber": "2081",
              "floorNumber": "2",
              "parkingNumber": "G-57",
              "unitNumber": "215",
              "commonAreaSquareMeter": 89.46,
              "areaSquareMeter": 94.94,
              "totalAreaSquareFeet": 1021.93,
              "suiteArea": 77.30,
              "balconyArea": 17.64,
              "parking": "Available",
              "municipalityNumber": "681 - 7408",
              "issueDate": "26/05/2023",
              "isMortgaged": false,
              "hasParkingSpace": false,
              "owners": [
                {
                  "name": "Owner 1",
                  "share": 47.47,
                  "ownerNumber": "6079141"
                },
                {
                  "name": "Owner 2",
                  "share": 52.53,
                  "ownerNumber": "5785324"
                }
              ],
              "transactionDetails": {
                "purchasedFrom": "Hassan Hamza Shattara",
                "landRegistrationNumber": "105926/2023",
                "transactionDate": "25/05/2023",
                "amount": {
                  "value": 925000,
                  "currency": "AED"
                },
                "amountInWords": "Nine Hundred Twenty Five Thousand UAE Dirhams only"
              },
              "mortgageStatus": {
                "mortgagedInFavorOf": "EMIRATES NBD BANK (P.J.S.C)",
                "status": "Active"
              },
              "digitalCertificateInfo": {
                "secureStorage": "Blockchain",
                "electronicIssues": "Certificate is electronically issued and no signature or stamp is required",
                "changePolicy": "Any changes in the certificate make it void",
                "holderPolicy": "It is prohibited to hold this certificate by any other party"
              },
              "additionalInfo": {...}
            }
          `,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${image.format};base64,${image.image}`,
                detail: 'auto',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices?.[0]?.message?.content || '{}') as TitleDeedSchema;
  }

  async fileSearch(file: Express.Multer.File) {
    const fileStream = this.bufferToFileStream(file.buffer, file.originalname);

    const maintenanceImg = await this._client.files.create({
      file: fileStream,
      purpose: 'assistants',
    });

    const threadMessage: OpenAI.Beta.Threads.ThreadCreateParams.Message = {
      role: 'user',
      content: 'What kind of maintenance work required based on this image?',
      attachments: [
        {
          file_id: maintenanceImg.id,
          tools: [
            {
              type: 'file_search',
            },
          ],
        },
      ],
    };

    const thread = await this._client.beta.threads.create({
      messages: [threadMessage],
    });

    // The thread now has a vector store in its tool resources.
    console.log(thread);

    const vectorStoreIds = thread.tool_resources?.file_search?.vector_store_ids || [];

    if (!vectorStoreIds.length) {
      throw new UnprocessableEntityException('No vector store found');
    }

    const assistant = await this._client.beta.assistants.create({
      instructions:
        'You are a helpful maintenant engineer and you answer questions based on the files provided to you.',
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: vectorStoreIds,
        },
      },
    });

    console.log(assistant);

    const run = await this._client.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    const messages = await this._client.beta.threads.messages.list(thread.id, {
      run_id: run.id,
    });

    console.log(messages);

    const message = messages.data.pop()!;

    if (message.content[0].type === 'text') {
      const { text } = message.content[0];
      const { annotations } = text;
      const citations: string[] = [];

      let index = 0;
      for (let annotation of annotations) {
        text.value = text.value.replace(annotation.text, '[' + index + ']');

        if (annotation['file_citation']) {
          const citedFile = await this._client.files.retrieve(annotation['file_citation'].file_id);
          citations.push('[' + index + ']' + citedFile.filename);
        }

        index++;
      }

      console.log(text.value);
      console.log(citations.join('\n'));
    }
  }

  async describeImage(file: Express.Multer.File) {
    const response = await this._client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional maintenance engineer and you answer questions based on the files provided to you. You mention the type of maintenance work required based on the image provided to you as a text that will be used for ticket creation.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What kind of maintenance work required based on this image?',
            },
            {
              type: 'image_url',
              image_url: {
                url: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHwph92BohyKluSEdhwsbEXLgDzCbxu7N7Aw&s`,
                detail: 'auto',
              },
            },
          ],
        },
      ],
    });

    return response.choices?.[0]?.message?.content || null;
  }

  // async readFile() {
  //   // 1. Upload the file to OpenAI (from your app)
  //   const file = await this._client.files.create({
  //     file: fs.createReadStream('title-deed.pdf'),
  //     purpose: 'assistants',
  //   });

  //   // 2. Call assistant with the file attached
  //   const thread = await this._client.beta.threads.create();
  //   await this._client.beta.threads.messages.create(thread.id, {
  //     role: 'user',
  //     content: 'Please extract the data from this PDF',
  //     file_ids: [file.id],
  //   });
  // }
}
