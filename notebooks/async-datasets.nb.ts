// %%
import { z } from "zod";
import { Datasets } from "../source/datasets.ts";
import { interleave } from "../source/asyncItertools.ts";

// %%
const log = console.log;

// %%
const ds = new Datasets({
  dataset: "rajpurkar/squad",
  schema: z.object({
    id: z.string(),
    title: z.string(),
    context: z.string(),
    question: z.string(),
    answers: z.object({
      text: z.array(z.string()),
      answer_start: z.array(z.number()),
    }),
  }),
});

// %%
const results = ds.data({
  split: "train",
  config: "plain_text",
  options: { offset: 0 },
});

const ds2 = new Datasets({
  dataset: "rajpurkar/squad",
  schema: z.object({
    id: z.string(),
    title: z.string(),
    context: z.string(),
    question: z.string(),
    answers: z.object({
      text: z.array(z.string()),
      answer_start: z.array(z.number()),
    }),
  }),
});

// %%
const results2 = ds2.data({
  split: "train",
  config: "plain_text",
  options: { offset: 0 },
});

let count1 = 0;
for await (const rows of interleave([results, results2])) {
  if (count1++ > 5) {
    break;
  }
  for (const row of rows) {
    log(row.row);
  }
}
