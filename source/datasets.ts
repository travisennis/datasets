import fs from "node:fs/promises";
import * as path from "node:path";
import type { z } from "zod";
import {
  createDataSchema,
  datasetInfoSchema,
  parquetListSchema,
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

  async listParquetFiles() {
    const response = await this.fetchFromAPI(
      `${this.baseUrl}/parquet?dataset=${encodeURIComponent(this.dataset)}`,
    );

    const list = parquetListSchema.parse(response);
    return list;
  }

  async downloadParquetFiles({
    downloadDir,
  }: { downloadDir?: string }): Promise<string[]> {
    try {
      const destPath = path.join(
        downloadDir ||
          `${process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`}/dataset-downloads`,
        this.dataset,
      );

      // Get list of parquet files
      const parquetFiles = await this.listParquetFiles();

      const parquetUrls = parquetFiles.parquet_files; //.map((file) => [
      //   file.filename,
      //   file.url,
      // ]);

      console.dir(parquetUrls);

      if (!parquetUrls.length) {
        throw new Error("No parquet files found");
      }

      // Download each parquet file
      const downloadPromises = parquetUrls.map(async (file, index) => {
        const finalDest = path.join(destPath, file.config, file.split);
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
        const filePath = path.join(finalDest, fileName);

        // Save file to local filesystem
        const arrayBuffer = await blob.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));

        return filePath;
      });

      // Wait for all downloads to complete
      const downloadedFiles = await Promise.all(downloadPromises);
      return downloadedFiles;
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
