import type { z } from "zod";
import {
  createDataSchema,
  datasetInfoSchema,
  splitsSchema,
  validationSchema,
} from "./types.ts";

export class Datasets<T extends z.ZodTypeAny> {
  private baseUrl: string;
  private dataset: string;
  private datasetSchema: ReturnType<typeof createDataSchema<T>>;

  constructor({
    dataset,
    schema,
  }: Readonly<{
    dataset: string;
    schema: T;
  }>) {
    this.baseUrl = "https://datasets-server.huggingface.co";
    this.dataset = dataset;
    this.datasetSchema = createDataSchema<T>(schema);
  }

  async validate() {
    const response = await this.fetchFromAPI(
      `${this.baseUrl}/is-valid?dataset=${encodeURIComponent(this.dataset)}`,
    );

    const validation = validationSchema.parse(response);
    return validation;
  }

  async splits() {
    const response = await this.fetchFromAPI(
      `${this.baseUrl}/splits?dataset=${encodeURIComponent(this.dataset)}`,
    );

    const splits = splitsSchema.parse(response);
    return splits;
  }

  async info(config = "default") {
    const response = await this.fetchFromAPI(
      `${this.baseUrl}/info?dataset=${encodeURIComponent(this.dataset)}&config=${config}`,
    );

    const info = datasetInfoSchema.parse(response);
    return info;
  }

  // https://datasets-server.huggingface.co/rows?dataset=hotpot_qa&config=distractor&split=train&offset=0&length=100

  async getRows({
    split,
    config,
    options = {},
  }: Readonly<{
    split: string;
    config: string;
    options: Readonly<{ offset?: number; length?: number }>;
  }>) {
    const offset = options.offset ?? 0;
    const length = options.length ?? 100;
    const ds = encodeURIComponent(this.dataset);

    const url = `${this.baseUrl}/rows?dataset=${ds}&config=${config}&split=${split}&offset=${offset}&length=${length}`;

    const response = await this.fetchFromAPI(url);

    const data = this.datasetSchema.parse(response);

    return data.rows;
  }

  async *data({
    split,
    config,
    options = {},
  }: Readonly<{
    split: string;
    config: string;
    options?: Readonly<{ offset?: number; length?: number }>;
  }>) {
    let currentOffset = options?.offset ?? 0;
    const length = options?.length ?? 100;
    const ds = encodeURIComponent(this.dataset);

    while (true) {
      const url = `${this.baseUrl}/rows?dataset=${ds}&config=${config}&split=${split}&offset=${currentOffset}&length=${length}`;

      const response = await this.fetchFromAPI(url);

      const data = this.datasetSchema.parse(response);

      if (data.rows.length === 0) {
        return;
      }

      yield data.rows;
      currentOffset += length;
    }
  }

  private async fetchFromAPI(url: string): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_ACCESS_TOKEN}`,
      },
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Error fetching data ${url}: ${response.statusText}`);
    }
    return response.json();
  }
}
