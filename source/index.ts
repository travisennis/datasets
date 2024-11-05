import { Datasets } from "./datasets.ts";

export function datasets({ dataset }: Readonly<{ dataset: string }>) {
  return new Datasets({
    dataset,
  });
}

export type { Validation, Splits, DatasetInfo, DatasetRows } from "./types.ts";
