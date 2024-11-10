// %%
import { z } from "zod";
import { Datasets } from "../source/datasets.ts";

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

for await (const rows of results) {
  for (const row of rows) {
    log(row.row);
  }
}
