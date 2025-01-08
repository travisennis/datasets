// %%
import { z } from "zod";
import { Datasets } from "../source/datasets.ts";
import { interleave } from "../source/asyncItertools.ts";

// %%
const log = console.log;

const ds3 = new Datasets({
  dataset: "sentence-transformers/all-nli",
  schema: z.object({
    anchor: z.string(),
    positive: z.string(),
  }),
});

const results3 = ds3.data({
  split: "train",
  config: "pair",
  options: { offset: 0, length: 5 },
});

const ds4 = new Datasets({
  dataset: "sentence-transformers/natural-questions",
  schema: z.object({
    anchor: z.string(),
    positive: z.string(),
  }),
  transform: {
    schema: z.object({
      query: z.string(),
      answer: z.string(),
    }),
    map: (input) => {
      return {
        anchor: input.query,
        positive: input.answer,
      };
    },
  },
});

const results4 = ds4.data({
  split: "train",
  config: "pair",
  options: { offset: 0, length: 5 },
});

let count2 = 0;
for await (const rows of interleave([results3, results4])) {
  if (count2++ > 5) {
    break;
  }
  for (const row of rows) {
    log(row.row);
  }
}
