// %%
import { z } from "zod";
import { Datasets } from "../source/datasets.ts";

// %%
const log = console.log;
log(process.env.HUGGINGFACE_ACCESS_TOKEN);

// %%
const dataloader = new Datasets({
  dataset: "KingNish/reasoning-base-20k",
  schema: z.record(z.any()),
});

// %%
log(await dataloader.validate());

log(await dataloader.splits());

log(await dataloader.info());

// %%
const results = await dataloader.getRows({
  split: "train",
  config: "default",
  options: { offset: 0, length: 5 },
});

log(results.at(0)?.row);

//%
const results2 = dataloader.data({
  split: "train",
  config: "default",
  options: { offset: 0, length: 5 },
});

const row2 = await results2.next();
if (!row2.done) {
  log(row2.value.at(0)?.row);
}

// %%
const dataloader2 = new Datasets({
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
const results3 = await dataloader2.getRows({
  split: "train",
  config: "plain_text",
  options: { offset: 0, length: 5 },
});

log(results3.at(0)?.row);

//%
const results4 = dataloader2.data({
  split: "train",
  config: "plain_text",
  options: { offset: 0, length: 5 },
});

const row4 = await results4.next();
if (!row4.done) {
  log(row4.value.at(0)?.row);
}

// %%
const list = await dataloader2.listParquetFiles();
console.dir(list);
