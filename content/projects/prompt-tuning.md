---
title: "Lightweight Model Experiment DAGs"
date: 2026-01-02T00:00:00-05:00
featured: true
description: "An opinionated approach"
tags: ["AI","LLM","prompt engineering","model evaluations"]
image: ""
link: "https://github.com/eric-mc2/tos-watch-az"
weight: 500
pubtype: "Guide"
sitemap:
  priority : 0.8
---

**Here's how to make your experiment / eval loops resilient to long-term refactoring.**

Common problems when running experiments:

1. v2 adds a new evaluation metric ... but it's missing from v1's results
2. v2 requires more features ... but these are hard to recompute on v1's inputs
3. v2 re-samples the data ... but it's hard to re-run against v1's model

The #1 concept: decouple execution from run artifacts. Here's the separation of responsibilities:

* **Upstream data**:
* **Input data**:
* **Model**:
* **Output data**:
    * Persist RAW model outputs as immutable objects.
* **Metrics**:
    * Metric scores are derived from the transformed raw outputs.

# Data Labeling Loop

This loop has three components:

1. Sampling:
    * Pulls representative examples from the dataset (random, stratified, golden set)
    * Dependencies:
        * Data features - e.g. to stratify by attribute
        * Past samples - to add new samples without replacement
        * Past outputs / weak models - to prioritize positives, negatives, low-confidence etc.
2. Pre-processing:
    * Converts native data format to labeler-supported format. Makes data human-readable.
    * Dependencies:
        * Weak models - if pre-filling suggested label
3. Labeling:
    * Human annotation
    * Dependencies:
        * **Coupled to metrics!**
4. Post-processing:
    * Converts labeled output format back to native format. Makes data machine-readable.

## What to preserve

Every example data that passes through this loop should be accompanied with metadata: 

```js
{model_version, 
output_schema_version, 
item_UID, 
annotation_timestamp}
```

# Experiment Loop

## Components

1. Sampling - choose a label set (or use all)
    * Dependencies:
        * Post-processed labels
2. Pre-processing - feature engineering
3. Model
 
## Architecture

So how do you track experiment runs with a file-based architecture?

Let's say you started off with:

```
/[DAG STAGE]/[UNIQUE PATH TO ITEM]/output.json
```

Absolutely DON'T do this:

```
/[DAG STAGE]/[UNIQUE PATH TO ITEM]/[MODEL VERSION]/output.json
```

Because it will quickly explode to this:

```
/[DAG STAGE]/[UNIQUE PATH TO ITEM]/[MODEL VERSION]/[SCHEMA VERSION]/output.json
```

Instead, store the provenance as *metadata* on the item, not baked into the item location!
With blob storage you can attach 8KB of metadata to each blob, separate from the content.
This naturally co-locates your `{}`

```
/[DAG STAGE]/[UNIQUE PATH TO ITEM]/latest.json  <-- pointer to most recent experiment. most non-evals code will query this item.
/[DAG STAGE]/[UNIQUE PATH TO ITEM]/HASH_ABC.json  <-- experiment 1 + metadata
/[DAG STAGE]/[UNIQUE PATH TO ITEM]/HASH_DEF.json  <-- experiment 2 + metadata
```

**How is the hash determined?**

A UUID or ULID is best for this purpose. There's no need or reason to hash the content or metadata. Doing so just increases maintenance costs. 

# Raw Outputs

Here's the problem: in v2 you changed the output format. Now your code can't read the v1 output.

Solution: *decouple output schemas from runtime code*.

```python
# --------- WRONG ---------
# evals.py  (git commit: v1)
from pydantic import BaseModel
class Output(BaseModel):
    classifier: bool
    topics: list[str]

with open("output.json") as f:
    output = Output(json.load(f))

# Why is this wrong? Look at how this breaks in v2:

# evals.py  (git commit: v2)
from pydantic import BaseModel
class Output(BaseModel):
    classifier: bool
    classifier_confidence: float
    topics: list[str]
    topics_confidence: list[float]

with open("output.json") as f:
    output = Output(json.load(f))
    # Fails validation!

# --------- RIGHT ---------
# RIGHT
# schemas/task_name/output/v1.py
from pydantic import BaseModel
class Output(BaseModel):
    classifier: bool
    topics: list[str]

# schemas/task_name/output/v2.py
from pydantic import BaseModel
class Output(BaseModel):
    classifier: bool
    classifier_confidence: float
    topics: list[str]
    topics_confidence: list[float]

# evals.py
metadata = get_metadata("output.json")
with open("output.json") as f:
    validator = importlib.import_module("schemas.task_name.output." + metadata.output_version)
    output = validator.Output(json.load(f))
    # Passes!

```


# Metrics

Here's the problem: models v1 and v2 output different information. It's hard to support all of the outputs.

Solution: implement CONVERTERS between output formats. v1 -> v2. v2 -> v3. etc. Now you only need to support one output format at a time (as long as it is robust to nulls).

## Components

1. Immutable model outputs
2. Metrics code
3. Metrics output


# Pipeline

For context here's how my pipeline DAG is represented in blob storage: `/[DAG STAGE]/[unique path to item].json` 

Every pipeline stage is a FOLDER, but tasks operate on single files. Pipeline triggers read the input item path (functionally a UID) and output into the next folder the corresponding sub-path.

