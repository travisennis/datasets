import type { z } from "zod";
import { Datasets } from "./datasets.ts";

export function datasets<T extends z.ZodTypeAny>({
  dataset,
  schema,
}: Readonly<{ dataset: string; schema: T }>) {
  return new Datasets<T>({
    dataset,
    schema,
  });
}

export type { Validation, Splits, DatasetInfo } from "./types.ts";
