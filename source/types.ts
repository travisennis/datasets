import { z } from "zod";

export const validationSchema = z.object({
  viewer: z.boolean(),
  preview: z.boolean(),
  search: z.boolean(),
  filter: z.boolean(),
  statistics: z.boolean(),
});

export type Validation = z.infer<typeof validationSchema>;

export const splitsSchema = z.object({
  splits: z.array(
    z.object({
      dataset: z.string(),
      config: z.string(),
      split: z.enum(["train", "validation", "test"]),
    }),
  ),
  pending: z.array(z.any()),
  failed: z.array(z.any()),
});

export type Splits = z.infer<typeof splitsSchema>;

export const datasetInfoSchema = z.object({
  // biome-ignore lint/style/useNamingConvention: Third-party API
  dataset_info: z.object({
    description: z.string(),
    citation: z.string(),
    homepage: z.string(),
    license: z.string(),
    features: z.record(z.any()),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    builder_name: z.string(),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    dataset_name: z.string(),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    config_name: z.string(),
    version: z.object({
      // biome-ignore lint/style/useNamingConvention: Third-party API
      version_str: z.string(),
      major: z.number(),
      minor: z.number(),
      patch: z.number(),
    }),
    splits: z.object({
      train: z.object({
        name: z.string(),
        // biome-ignore lint/style/useNamingConvention: Third-party API
        num_bytes: z.number(),
        // biome-ignore lint/style/useNamingConvention: Third-party API
        num_examples: z.number(),
        // biome-ignore lint/style/useNamingConvention: Third-party API
        dataset_name: z.string(),
      }),
      validation: z
        .object({
          name: z.string(),
          // biome-ignore lint/style/useNamingConvention: Third-party API
          num_bytes: z.number(),
          // biome-ignore lint/style/useNamingConvention: Third-party API
          num_examples: z.number(),
          // biome-ignore lint/style/useNamingConvention: Third-party API
          dataset_name: z.string(),
        })
        .optional(),
      test: z
        .object({
          name: z.string(),
          // biome-ignore lint/style/useNamingConvention: Third-party API
          num_bytes: z.number(),
          // biome-ignore lint/style/useNamingConvention: Third-party API
          num_examples: z.number(),
          // biome-ignore lint/style/useNamingConvention: Third-party API
          dataset_name: z.string(),
        })
        .optional(),
    }),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    download_size: z.number(),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    dataset_size: z.number(),
  }),
  partial: z.boolean(),
});

export type DatasetInfo = z.infer<typeof datasetInfoSchema>;

export function createDataSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    features: z.array(
      z.object({
        // biome-ignore lint/style/useNamingConvention: Third-party API
        feature_idx: z.number(),
        name: z.string(),
        type: z.union([
          z.object({
            feature: z.any(),
            _type: z.string(),
          }),
          z.object({
            dtype: z.string(),
            _type: z.string(),
          }),
          z.array(
            z.record(
              z.object({
                dtype: z.string(),
                _type: z.string(),
              }),
            ),
          ),
        ]),
      }),
    ),
    rows: z.array(
      z.object({
        // biome-ignore lint/style/useNamingConvention: Third-party API
        row_idx: z.number(),
        row: schema,
        // biome-ignore lint/style/useNamingConvention: Third-party API
        truncated_cells: z.array(z.unknown()),
      }),
    ),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    num_rows_total: z.number(),
    // biome-ignore lint/style/useNamingConvention: Third-party API
    num_rows_per_page: z.number(),
    partial: z.boolean(),
  });
}

export const parquetListSchema = z.object({
  // biome-ignore lint/style/useNamingConvention: Third-party API
  parquet_files: z.array(
    z.object({
      dataset: z.string(),
      config: z.string(),
      split: z.string(),
      url: z.string().url(),
      filename: z.string(),
      size: z.number().positive(),
    }),
  ),
  pending: z.array(z.any()),
  failed: z.array(z.any()),
  partial: z.boolean(),
});
