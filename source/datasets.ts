import fs from "node:fs/promises";
import { join } from "node:path";
import type { z } from "zod";
import {
  createDataSchema,
  datasetInfoSchema,
  parquetListSchema,
  splitsSchema,
  validationSchema,
} from "./types.ts";

export class Datasets<T extends z.ZodTypeAny, U extends z.ZodTypeAny = any> {
  private baseUrl: string;
  private dataset: string;
  private datasetSchema: ReturnType<typeof createDataSchema<T>>;
  private transform:
    | {
        schema: U;
        map: (input: z.infer<U>) => z.infer<T>;
      }
    | undefined;

  constructor({
    dataset,
    schema,
    transform,
  }: Readonly<{
    dataset: string;
    schema: T;
    transform?: {
      schema: U;
      map: (input: z.infer<U>) => z.infer<T>;
    };
  }>) {
    this.baseUrl = "https://datasets-server.huggingface.co";
    this.dataset = dataset;
    this.datasetSchema = createDataSchema<T>(schema);
    this.transform = transform;
  }

  async validate() {
    const response = await this.fetchFromApi(
      `${this.baseUrl}/is-valid?dataset=${encodeURIComponent(this.dataset)}`,
    );

    return validationSchema.parse(response);
  }

  async splits() {
    const response = await this.fetchFromApi(
      `${this.baseUrl}/splits?dataset=${encodeURIComponent(this.dataset)}`,
    );

    return splitsSchema.parse(response);
  }

  async info(config = "default") {
    const response = await this.fetchFromApi(
      `${this.baseUrl}/info?dataset=${encodeURIComponent(this.dataset)}&config=${config}`,
    );

    return datasetInfoSchema.parse(response);
  }

  async listParquetFiles() {
    const response = await this.fetchFromApi(
      `${this.baseUrl}/parquet?dataset=${encodeURIComponent(this.dataset)}`,
    );

    return parquetListSchema.parse(response);
  }

  async downloadParquetFiles({
    downloadDir,
  }: { downloadDir?: string }): Promise<string[]> {
    try {
      const destPath = join(
        downloadDir ||
          `${
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            process.env["XDG_CACHE_HOME"] || `${process.env["HOME"]}/.cache`
          }/dataset-downloads`,
        this.dataset,
      );

      // Get list of parquet files
      const parquetFiles = await this.listParquetFiles();

      const parquetUrls = parquetFiles.parquet_files;

      if (parquetUrls.length === 0) {
        throw new Error("No parquet files found");
      }

      // Download each parquet file
      const downloadPromises = parquetUrls.map(async (file, index) => {
        const finalDest = join(destPath, file.config, file.split);
        await fs.mkdir(finalDest, {
          recursive: true,
        });

        const url = file.url;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download ${url}: ${response.statusText}`);
        }
        const blob = await response.blob();
        const fileName = file.filename ?? `${this.dataset}${index}.parquet`;
        const filePath = join(finalDest, fileName);

        // Save file to local filesystem
        const arrayBuffer = await blob.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));

        return filePath;
      });

      // Wait for all downloads to complete
      return Promise.all(downloadPromises);
    } catch (error) {
      console.error("Error downloading parquet files:", error);
      throw error;
    }
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

    const response = await this.fetchFromApi(url);

    if (this.transform) {
      const intermediate = this.transform.map(
        createDataSchema<U>(this.transform.schema).parse(response),
      );
      const data = this.datasetSchema.parse(intermediate);
      return data.rows;
    }

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

      const response = await this.fetchFromApi(url);

      if (this.transform) {
        const intermediate = createDataSchema<U>(this.transform.schema).parse(
          response,
        );

        intermediate.rows = intermediate.rows.map((r) =>
          Object.assign(r, { row: this.transform?.map(r.row) }),
        );

        const data = this.datasetSchema.parse(intermediate);
        if (data.rows.length === 0) {
          return;
        }

        yield data.rows;
      } else {
        const data = this.datasetSchema.parse(response);

        if (data.rows.length === 0) {
          return;
        }

        yield data.rows;
      }

      currentOffset += length;
    }
  }

  private async fetchFromApi(url: string): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        Authorization: `Bearer ${
          // biome-ignore lint/complexity/useLiteralKeys: <explanation>
          process.env["HUGGINGFACE_ACCESS_TOKEN"]
        }`,
      },
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Error fetching data ${url}: ${response.statusText}`);
    }
    return response.json();
  }
}
