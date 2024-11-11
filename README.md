# @travisennis/datasets

A TypeScript library for interacting with the HuggingFace Datasets API.

## Installation

```bash
npm install @travisennis/datasets
```

## Usage

```typescript
import { datasets } from '@travisennis/datasets';
import { z } from 'zod';

// Define your dataset schema
const schema = z.object({
  question: z.string(),
  answer: z.string(),
});

// Initialize the dataset
const ds = datasets({
  dataset: 'hotpot_qa',
  schema,
});

// Get dataset information
const info = await ds.info();

// Get dataset splits
const splits = await ds.splits();

// Get rows from a specific split
const rows = await ds.getRows({
  split: 'train',
  config: 'distractor',
  options: { offset: 0, length: 100 }
});

// Stream data using iterator
for await (const batch of ds.data({
  split: 'train',
  config: 'distractor',
})) {
  console.log(batch);
}
```

## API Reference

### `datasets(options)`

Creates a new dataset instance.

#### Options
- `dataset`: The name of the HuggingFace dataset
- `schema`: A Zod schema defining the structure of the dataset

### Methods

#### `validate()`
Checks if the dataset is valid and accessible.

#### `splits()`
Returns available splits in the dataset.

#### `info(config = 'default')`
Returns dataset information including description, citation, and statistics.

#### `listParquetFiles()`
Lists available parquet files for the dataset.

#### `downloadParquetFiles(options)`
Downloads parquet files locally.
- `options.downloadDir`: Optional custom download directory

#### `getRows(options)`
Returns a batch of rows from the dataset.
- `options.split`: Dataset split (e.g., 'train', 'test')
- `options.config`: Dataset configuration
- `options.options.offset`: Starting row index
- `options.options.length`: Number of rows to fetch

#### `data(options)`
Returns an async iterator for streaming dataset rows.
- `options.split`: Dataset split
- `options.config`: Dataset configuration
- `options.options.offset`: Starting row index
- `options.options.length`: Batch size

## License

MIT
