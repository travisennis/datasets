// %%
import { Datasets } from "../source/datasets.ts";

// %%
const log = console.log;
log(process.env.HUGGINGFACE_ACCESS_TOKEN);

// %%
const dataloader = new Datasets({
  dataset: "KingNish/reasoning-base-20k",
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
