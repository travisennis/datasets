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
  dataset_info: z.object({
    description: z.string(),
    citation: z.string(),
    homepage: z.string(),
    license: z.string(),
    features: z.record(z.any()),
    builder_name: z.string(),
    dataset_name: z.string(),
    config_name: z.string(),
    version: z.object({
      version_str: z.string(),
      major: z.number(),
      minor: z.number(),
      patch: z.number(),
    }),
    splits: z.object({
      train: z.object({
        name: z.string(),
        num_bytes: z.number(),
        num_examples: z.number(),
        dataset_name: z.string(),
      }),
      validation: z
        .object({
          name: z.string(),
          num_bytes: z.number(),
          num_examples: z.number(),
          dataset_name: z.string(),
        })
        .optional(),
      test: z
        .object({
          name: z.string(),
          num_bytes: z.number(),
          num_examples: z.number(),
          dataset_name: z.string(),
        })
        .optional(),
    }),
    download_size: z.number(),
    dataset_size: z.number(),
  }),
  partial: z.boolean(),
});

export type DatasetInfo = z.infer<typeof datasetInfoSchema>;

export const dataSchema = z.object({
  features: z.array(
    z.object({
      feature_idx: z.number(),
      name: z.string(),
      type: z.union([
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
      row_idx: z.number(),
      row: z.record(z.any()),
      truncated_cells: z.array(z.unknown()),
    }),
  ),
  num_rows_total: z.number(),
  num_rows_per_page: z.number(),
  partial: z.boolean(),
});

export type DatasetRows = z.infer<typeof dataSchema>;
