---
title: "Public Safety News Analysis (Engineering)"
date: 2025-04-14T16:29:12-05:00
featured: true
description: "text analysis implementation"
tags: ["machine learning","data engineering","spacy","nlp","dagster","mlflow"]
image: ""
link: "https://github.com/eric-mc2/quantify-justice-news-geos/"
weight: 500
pubtype: "Model"
sitemap:
  priority : 0.8
---

This post describes the technical implementation of the public safety news [analysis](../qjn/index.html).

*Update: I've implemented a LOT more and need to update the writeup!*

## Training Data

**News articles**: 
I labeled an independent sample to train each task. 

**Chicago streets network**:
I enumerated all blocks and intersections and spatially
joined these with community area boundaries. I used these
{location -> community area} mappings as synthetic data
to train the classifier.

## Architecture

**Article Classifier**:
This is an off-the-shelf uninitialized binary text classification
model. I only use article titles for classification, since they are
much shorter and less noisy than article bodies.

**Sentence Classifier**:
This is an off-the-shelf uninitialized multi-label classification model. This model predicts whether the sentence describes the 
WHO, WHAT, WHERE or WHEN of the crime incident. (I'm the
least confident in this specific task formulation.)

**Location recognition**:
I extend the pre-trained named entity recognizer with custom pre-
and post-inference steps. Spacy models are particularly
easy to combine machine-learning and rules-based pipeline components. Before NER runs, I match on an explicit list of local
vocabulary terms:

* the "sides" of the city e.g. North Side, South Side
* all street, neighborhood, and community area names

After NER runs, I match on conventions that are common to news language:

* "1300[number] block of North Webster Ave[street]" becomes "1300 block of North Webster Ave[block]"

Finally I enhance the NER classification with finer-grained location terms, classifying whether the location is a block, street, intersection, neighborhood, or community area. 

**Semantic Relationship**
I use a naive implementation here. I just include sentences
that were positive matches for both sentence classification and location entity recognition. I don't utilize the dependency parse
or SRL models yet.

**Community Area Classification**
The Chicago streets and neighborhood boundaries gives us an exact mapping of locations to community areas. I leverage this first, before resorting to machine learning. Given the location type provided by the NER stage, I check for an exact match of the location text and emit the associated community area.

Otherwise I send the location text through a text classification model, returning the predicted community area.

## Infrastructure

I'm using [Dagster](https://dagster.io/) to explicitly
declare and manage the separate pre-processing, training,
evaluation, and tuning steps per pipeline stage. 

![Dagster pipeline](/img/dagster-art-relevance.svg)

## Pipeline

I have a bias towards file-centric pipeline declarations like Makefiles and [dvc](https://dvc.org/doc/user-guide/pipelines/defining-pipelines). These methods encourage making your processing code agnostic
as to *where* data is located. Especially with dvc, it's very easy to quickly scan the 
order that different files are created and the relationships between inputs, processing, and outputs. 

### Data Discovery

I follow those concepts in my dagster definitions. First, I define all data paths
in an external config file, which is organized by stage:

```yaml
# data_sources.yaml
raw:
  article_text: "raw/articles.parquet"
pre_relevance:
  article_text: "pre_relevance/articles.parquet"
art_relevance:
  article_text_prototype: "art_relevance/articles_prototype.parquet"
  article_text_preproc: "art_relevance/articles_preproc.json"
```

Notice how these paths are *relative*. This allows the data folder itself to 
be environment-specific, which is checked when the config is loaded. (For 
local development it is just "./data" within the project folder. For running on
Colab, it is a Google Drive path "/gdrive/MyDrive/.../data").

```python
from scripts.utils import Config
config = Config()
print(config.get_data_path("raw.article_text"))
"/absolute/path/to/project/data/raw/newsarticles.parquet"
```

### Stage Declarations

Next I define my dagster stages. The goal is to make this file really compact
and to highlight a) the logical stage dependencies and b) the input output 
flows. To achieve this, I separate the actual processing logic to a different
file `operations.py`. And as before, the actual data locations are
isolated and loaded through the config file. 

```python
# scripts/art_relevance/assets.py
import dagster as dg
from scripts.utils import Config
from scripts.art_relevance import operations as ops
config = Config()
@dg.asset
def extract():
    dep_path = config.get_data_path("raw.zip")
    out_path = config.get_data_path("raw.article_text")
    ops.extract(dep_path, out_path)

@dg.asset(deps=[extract], description="Filter using external relevance model")
def pre_relevant():
    dep_path = config.get_data_path("raw.article_text")
    out_path = config.get_data_path("pre_relevance.article_text")
    ops.pre_relevant(dep_path, out_path)
```

This way the processing functions (ops) can be arbitrarily complicated, but
`assets.py` makes it very clear how they should be chained.

## Training

The volunteer-contributed training data for this project addresses the 
high-level end-to-end task. Unfortunately these data wouldn't be very helpful
to train each sub-task model because each model sees a different conditional subset of the data.

The idea is to prototype each sub-model quickly, get a sense of the overall performance,
get a sense of which sub-units need improvement. As you saw in the dagster diagram, 
I've inserted a "prototype_sampling" stage which picks 200 random records to
use as a working set to develop the first model. I export these to 
[Label Studio](https://labelstud.io/) and spend an hour annotating.

![Positive example](/img/article_relevance_pos.png)
*A positive example.*

![Negative example](/img/article_relevance_neg.png)
*A negative example.*

I am using [MLFlow](https://mlflow.org/) to track model experiments. I load
the spacy config file, flatten it like `{"nested.key.param1": val1, "nested.key.param2": val2}`
and dump the full parameter list into MLFlow. Spacy provides a convenient function
`spacy.util.load_config(path, overrides: dict)`
making it easy to alter the configuration in-memory instead of writing each change
to disk. Even though 99.9% of the values are unchanged run-to-run, 
this way I'm never missing a baseline parameter value if I run a new experiment.

So far I've tested limited-scope changes (ie. doesn't require different pre/post processing).
Besides the "quickstart" model using the default spacy configs, I'm using 
[Optuna](https://optuna.readthedocs.io/) for hyperparameter tuning. And of course
a baseline "null_model" which simply measures the frequency of positive values 
in the training set and predicts the positive class with that likelihood. 

![MLFlow logs](/img/mlflow_art_relevance.png)

At this point, with only 160 training
and 20 dev examples, there isn't enough variation in the data itself for the
hyperparameters to impact the model's performance.

# Next Steps - Sentence Classifier

I will pull a new set of a few hundred articles, filter them through the
article-classifier prototype, and use the "relevant" articles to train the next task.
With this prototype 29% of the articles it passes to the next stage will be irrelevant, meaning more
wasted time in Label Studio. 

Many articles (e.g. sports) use violence-laden language to describe non-criminal acts. These cases will
likely confuse the model at the sentence-level, which is why I attempted filtering at the
article-level. Hopefully these cases will not severely degrade the sentence-level
model too much.

On the bright side, this prototype is an improvement over the externally labeled
`pre_relevance` stage, which had a precision of 36%. Since the next model is also
a text classifier, I can re-use a lot of the pipeline and training aparatus from
this stage.
