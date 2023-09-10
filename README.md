---
title: sagemaker studio for ml environment
description: sagemaker studio for ml environment
author: haimtran
publishedDate: 05/23/2023
date: 2022-05-23
---

## Introduction

- Understand SageMakers studio infrastructure
- Create domain, user profile, apps
- Manage access control via IAM and studiouserid tag
- Configure life cycle configuration for domain, and user

## SageMaker Studio

There are basic concepts

- domain
- user profile
- share location
- apps

![sagemaker-studio-arch](/assets/sagemaker-studio-arch.png)

## Data Scientist

- [Turn on sourceIdentity
  ](https://docs.aws.amazon.com/sagemaker/latest/dg/monitor-user-access.html)
- Tag the User Profile in SageMaker domain
- Create a Role, and IAM user for DS from SageMaker console

Tag the user profile in a domain using studiouserid for key and user profile name for value

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AmazonSageMakerPresignedUrlPolicy",
      "Effect": "Allow",
      "Action": ["sagemaker:CreatePresignedDomainUrl"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "sagemaker:ResourceTag/studiouserid": "${aws:username}"
        }
      }
    }
  ]
}
```

Create a role which will be assumed by the DS IAM user. To enable the DS to launch studio which attached to a user profile, we need to setup IAM policy: 1) using tab studiouserid or 2) arn resource. Let create an IAM policy for DS and use studiouserid

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:CreateApp",
        "sagemaker:CreateAppImageConfig",
        "sagemaker:UpdateAppImageConfig",
        "sagemaker:DeleteApp",
        "sagemaker:DeleteAppImageConfig",
        "sagemaker:DescribeApp",
        "sagemaker:DescribeAppImageConfig",
        "sagemaker:DescribeDomain",
        "sagemaker:DescribeUserProfile"
      ],
      "Resource": ["*"]
    },
    {
      "Effect": "Allow",
      "Action": ["sagemaker:CreatePresignedDomainUrl"],
      "Resource": ["*"],
      "Condition": {
        "StringEquals": {
          "sagemaker:ResourceTag/studiouserid": "default-1684815788251"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:ListApps",
        "sagemaker:ListAppImageConfigs",
        "sagemaker:ListDomains",
        "sagemaker:ListUserProfiles",
        "sagemaker:ListSpaces"
      ],
      "Resource": "*"
    }
  ]
}
```

It is possible to control access by resource arn

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:CreateApp",
        "sagemaker:CreateAppImageConfig",
        "sagemaker:UpdateAppImageConfig",
        "sagemaker:DeleteApp",
        "sagemaker:DeleteAppImageConfig",
        "sagemaker:DescribeApp",
        "sagemaker:DescribeAppImageConfig",
        "sagemaker:DescribeDomain",
        "sagemaker:DescribeUserProfile"
      ],
      "Resource": ["*"]
    },
    {
      "Effect": "Allow",
      "Action": ["sagemaker:CreatePresignedDomainUrl"],
      "Resource": [
        "arn:aws:sagemaker:ap-southeast-1:014600194779:domain/d-5uqevrcgia9q",
        "arn:aws:sagemaker:ap-southeast-1:014600194779:user-profile/d-rmxdg2gitvsb/default-1684815788251"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:ListApps",
        "sagemaker:ListAppImageConfigs",
        "sagemaker:ListDomains",
        "sagemaker:ListUserProfiles",
        "sagemaker:ListSpaces"
      ],
      "Resource": "*"
    }
  ]
}
```

Please take note the trust policy for the DS Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sagemaker.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::014600194779:user/da"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Install Packages

- Select correct environment and install wanted packages
- Pre-installed by life cycle configuration
- [LSP](https://github.com/cdk-entest/sagemaker-studio/blob/master/lifecycle-config/lsp-advanced.sh)
- [Auto Shutdown](https://github.com/cdk-entest/sagemaker-studio/blob/master/lifecycle-config/auto-shut-down.sh)

As recommended by the [docs](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi-add-external.html), install from Notebook is the best because it ensure the correct environment selected

```py
%pip install pyarrow
```

It is possible to isntall from teriminal, but we need to activate the correct environment first

```bash
conda activate studio
```

Then install wanted packages, or entire script

```bash
pip install jupyterlab-code-formatter black
```

Install language servers

```bash
pip install jupyterlab-lsp \
    'python-lsp-server[all]' \
    jupyterlab-spellchecker
```

Please use this to prevent error SageMaker Launcher not appear :smile:

```bash
pip install jupyterlab-lsp \
    jupyterlab-spellchecker
```

Then restart the jupyter server, wait for the terminal closed and refresh the browser notebook

```bash
restart-jupyter-server
```

Some useful command with conda in the Jupyter Server (note the Kernel). For example to list environment

```bash
conda env list
```

To list packages installed in an environment

```bash
conda list -n studio
```

## Life Cycle Configuration

There are two common use cases

- Install some libraries => target KernelGateway
- Auto shutdown idle instances => target JupyterAppServer

Let setup the first case:

- Step 1. Prepare the script, for example, a script to install pyarrow

```bash
#!/bin/bash
set -eux

# PARAMETERS
PACKAGE=pyarrow

pip install --upgrade $PACKAGE
```

- Step 2. If deploy via CDK or CLI, need to convert the bash to based 64 text

If we create life cycle configration in console, just paste the bash command directly to editor in SageMaker console.

```bash
LCC_CONTENT=`openssl base64 -A -in install-package.sh`
```

As we want to install libraries for the underlying SageMaker kernel, we will target this life cycle configuration to KernelGateway

```bash
aws sagemaker create-studio-lifecycle-config \
--studio-lifecycle-config-name install-pip-package-on-kernel \
--studio-lifecycle-config-content $LCC_CONTENT \
--studio-lifecycle-config-app-type KernelGateway
```

- Step 3. Attach the life cycle configuration to either domain or user profile level

- Step 4. To make sure it work, either stop and start apps again

Similarly, follow the same procedure to setup a shutdown script for SageMaker studio at domain or user profile level. Please note that we have to target JupyterAppServer in this case instead of KernelGateway. [auto-shutdown-script.sh](https://github.com/aws-samples/sagemaker-studio-lifecycle-config-examples/tree/main/scripts/install-autoshutdown-server-extension)

## Code Server

It is possible to create a code server running on SageMaker then we have vscode as normal. First, let go into SageMaker studio system terminal and install

```bash
curl -LO https://github.com/aws-samples/amazon-sagemaker-codeserver/releases/download/v0.1.5/amazon-sagemaker-codeserver-0.1.5.tar.gz
tar -xvzf amazon-sagemaker-codeserver-0.1.5.tar.gz

cd amazon-sagemaker-codeserver/install-scripts/studio

chmod +x install-codeserver.sh
./install-codeserver.sh
```

Second, from SageMaker studio launcher, we see the code server enabled as below picture

Third, start using the code server either via web or from local vscode via remote access. Select python intepreter and install dependencies

```bash
/opt/.cs/conda/envs/codeserver_py39/bin/python -m pip install -r requirements.txt
```

![sagemaker-code-server](/assets/sagemaker-code-server.png)

## SageMaker Feature Store

Undersand basic concepts

- Feature group
- Ingest dataframe into a feature group
- Feature group and Glue table
- Query with Athena

Two very important docs for developers

- [boto3 sagemaker feature store](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sagemaker-featurestore-runtime.html)

- [Feature Store APIs](https://sagemaker.readthedocs.io/en/stable/api/prep_data/feature_store.html#feature-store)

Step 1) Let create a feature groups

```py
from sagemaker.feature_store.feature_group import FeatureGroup

customers_feature_group = FeatureGroup(
    name=customers_feature_group_name,
    sagemaker_session=sagemaker_session
)
orders_feature_group = FeatureGroup(
    name=orders_feature_group_name,
    sagemaker_session=sagemaker_session
)

```

Create definition for feature groups

```py
customers_feature_group.load_feature_definitions(data_frame=customer_data)
orders_feature_group.load_feature_definitions(data_frame=orders_data)
```

Ingest dataframe into feature groups

```py
customers_feature_group.create(
    s3_uri=f"s3://{s3_bucket_name}/{prefix}",
    record_identifier_name=record_identifier_feature_name,
    event_time_feature_name="EventTime",
    role_arn=role,
    enable_online_store=True,
)

orders_feature_group.create(
    s3_uri=f"s3://{s3_bucket_name}/{prefix}",
    record_identifier_name=record_identifier_feature_name,
    event_time_feature_name="EventTime",
    role_arn=role,
    enable_online_store=True,
)
```

Step 2) Add metadata to a feature

```py
from sagemaker.feature_store.inputs import FeatureParameter

customers_feature_group.update_feature_metadata(
    feature_name="customer_id",
    description="The ID of a customer. It is also used in orders_feature_group.",
    parameter_additions=[FeatureParameter("idType", "primaryKey")],
)

customers_feature_group.describe_feature_metadata(feature_name="customer_id")

```

Step 3) Feature Store API - List Feature Group

```py
from sagemaker.feature_store.feature_store import FeatureStore
from sagemaker.feature_store.inputs import Identifier

feature_store = FeatureStore(
    sagemaker_session=sagemaker_session
)

feature_store.list_feature_groups()
```

Step 4) Feature Store API - Read a batch records

```py
feature_store.batch_get_record(
    identifiers=[
        Identifier(
            feature_group_name="customers-feature-group-28-03-41-44",
            record_identifiers_value_as_string= ["573291", "109382", "828400", "124013"]
        )
    ]
)

```

Step 5) Feature Store API - Athena Query

```py
from sagemaker.feature_store.feature_group import AthenaQuery

customer_query = AthenaQuery(
    sagemaker_session=sagemaker_session,
    catalog="AwsDataCatalog",
    database="sagemaker_featurestore",
    table_name="customers_feature_group_28_03_41_44_1685245305"
)

customer_query.run(
    'select * from customers_feature_group_28_03_41_44_1685245305',
    output_location=f"s3://{s3_bucket_name}/notebook-athena-result/"
)

customer_df = customer_query.as_dataframe()

customer_df.head(10)

```

## SageMaker Local PySpark

- DataScience kernel and install PySpark
- Reand and write data from S3
- Simple feature processing

## SageMaker Spark Processor

- Develop with Glue notebook
- Parse arguments
- PySparkProcessor
- [sg-glue-spark](https://github.com/cdk-entest/sagemaker-studio/blob/master/notebook/sg-glue-spark.ipynb) and [sg-spark-processing](https://github.com/cdk-entest/sagemaker-studio/blob/master/notebook/sg-spark-processing.ipynb)

Section 1) To use Glue interactive session right in SageMaker studio notebook

- Update role for notebook
- Choose Spark Analytics kernel with Glue PySpark and Ray [HERE](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-notebooks-glue.html)

First, we need to attach AwsGlueSessionUserRestrictedServiceRole to the role, then update policy with iam PassRole and GetRole as

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "unique_statement_id",

      "Effect": "Allow",
      "Action": ["iam:GetRole", "iam:PassRole", "sts:GetCallerIdentity"],
      "Resource": "*"
    }
  ]
}
```

Second, need to update the trust policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["glue.amazonaws.com", "sagemaker.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Third, launch a notebook and select Spark Analytics and PySpark (Ray) kernel, configure the Glue session by magic

```py
# %additional_python_modules matplotlib, numpy, pandas
# %idle_timeout 60
# %glue_version 3.0
# %number_of_workers 5
# %iam_role arn:aws:iam::413175686616:role/RoleForDataScientistUserProfile
```

Fourth, create Glue and Spark context

```py
from awsglue.context import GlueContext
from pyspark.context import SparkContext
from pyspark.sql import SparkSession

sc = SparkContext.getOrCreate()
glueContext = GlueContext(sc)

# spark = glueContext.spark_session
spark = SparkSession.builder.appName("PySparkApp").getOrCreate()
```

Read parquet from S3

```py
df_parquet = spark.read.format("parquet").load(f"s3://{source_bucket_name}/parquet/")
```

Read csv from S3 with schema. First define a schema

```py
from pyspark.sql.types import IntegerType, StringType, StructType

schema = (
    StructType()
    .add("marketplace", StringType(), True)
    .add("customer_id", StringType(), True)
    .add("review_id", StringType(), True)
    .add("product_id", StringType(), True)
    .add("product_parent", IntegerType(), True)
    .add("product_title", StringType(), True)
    .add("product_category", StringType(), True)
    .add("star_rating", IntegerType(), True)
    .add("helpful_vote", IntegerType(), True)
    .add("total_vote", IntegerType(), True)
    .add("vine", StringType(), True)
    .add("verified_purchase", StringType(), True)
    .add("review_headline", StringType(), True)
    .add("review_body", StringType(), True)
    .add("myyear", StringType(), True)
)
```

Then load csv from S3 into a Spark dataframe

```py
df_csv = (
    spark.read.format("csv")
    .option("header", True)
    .schema(schema)
    .option("delimiter", "\t")
    .option("quote", '"')
    .load(f"s3://{source_bucket_name}/tsv/")
    # .select("marketplace", "customer_id", "review_id", "product_id", "product_title")
)
```

A very simple transform which select some columns of interest

```py
df_clean = df_csv.select("marketplace", "customer_id", "product_id", "star_rating")
```

Finally, write the dataframe to S3

```py
df_clean.write.format("parquet").save(f"s3://{dest_bucket_name}/amazon-reviews/")
```

Double check the result in S3

```py
!aws s3 ls --summarize --human-readable --recursive s3://sagemaker-us-east-1-413175686616/amazon-reviews/
```

Section 2) Pass arguments from run command to the job script by using argparse. First defin parser in the main function, for example, main.py

```py
parser = argparse.ArgumentParser(description="app inputs and outputs")
parser = argparse.ArgumentParser(description="app inputs and outputs")
parser.add_argument("--source_bucket_name", type=str, help="s3 input bucket")
parser.add_argument("--dest_bucket_name", type=str, help="output s3 prefix")
args = parser.parse_args()
```

Then pass arguments from running command, similar with container

```bash
python main.py --source_bucket_name sagemaker-us-east-1
```

The processing code in PySpark [HERE]()

```py
%%writefile ./spark-code/preprocess.py
import argparse

from pyspark.context import SparkContext
from pyspark.sql import SparkSession
from pyspark.sql.types import IntegerType, StringType, StructType

# create spark session
spark = SparkSession.builder.appName("PySparkApp").getOrCreate()

# create schema
schema = (
    StructType()
    .add("marketplace", StringType(), True)
    .add("customer_id", StringType(), True)
    .add("review_id", StringType(), True)
    .add("product_id", StringType(), True)
    .add("product_parent", IntegerType(), True)
    .add("product_title", StringType(), True)
    .add("product_category", StringType(), True)
    .add("star_rating", IntegerType(), True)
    .add("helpful_vote", IntegerType(), True)
    .add("total_vote", IntegerType(), True)
    .add("vine", StringType(), True)
    .add("verified_purchase", StringType(), True)
    .add("review_headline", StringType(), True)
    .add("review_body", StringType(), True)
    .add("myyear", StringType(), True)
)


def main():
    """
    parse argument
    """
    # define parser
    parser = argparse.ArgumentParser(description="app inputs and outputs")
    parser.add_argument("--source_bucket_name", type=str, help="s3 input bucket")
    parser.add_argument("--dest_bucket_name", type=str, help="output s3 prefix")

    # parse argument
    args = parser.parse_args()
    print(f"{args.source_bucket_name} and {args.dest_bucket_name}")

    # read data from s3
    df_csv = (
        spark.read.format("csv")
        .option("header", True)
        .schema(schema)
        .option("delimiter", "\t")
        .option("quote", '"')
        .load(f"s3://{args.source_bucket_name}/tsv/")
    )

    # transform and feature engineer
    df_clean = df_csv.where("marketplace='US'").select(
        "marketplace", "customer_id", "product_id", "star_rating"
    )

    # write data to s3
    df_clean.write.format("parquet").save(
        f"s3://{args.dest_bucket_name}/amazon-reviews/"
    )


if __name__ == "__main__":
    main()
```

Section 3) Create a PySparkProcessor processing job

```py
spark_processor = PySparkProcessor(
    base_job_name="process-amazon-reviews",
    framework_version="3.1",
    role=role,
    instance_count=2,
    instance_type="ml.m5.xlarge",
    max_runtime_in_seconds=1200,
    tags=[{"Key": "tag-key", "Value": "tag-value"}],
)
```

then run the job

```py
spark_processor.run(
    submit_app="./spark-code/preprocess.py",
    arguments=[
        "--source_bucket_name",
        source_bucket_name,
        "--dest_bucket_name",
        dest_bucket_name,
    ],
    logs=False,
)
```

## SageMaker Experiment

Developing ML models is an interative process, we need to track input, output, metrics, log, etc. So SageMaker experiment's purpose is to 1) log, and 2) analyse those objects.

- What SageMaker Experiment can do?

Log a single parameter

```py
run.log_parameter("param1", "value1")
```

Log multiple parameters

```py
run.log_parameters({
    "param2": "value2",
    "param3": "value3"
})
```

Log metric

```py
run.log_metric(name="test:loss", value=loss, step=epoch)
```

Log files to S3

```py
run.log_file("training_data.csv", name="training_data", is_output=False)
```

Log artifacts

```py
run.log_artifact(name="training_data", value="data.csv" is_output=False)
```

- How to use SageMaker Experiment SDK?

Let look at a example below, Run is an object which profile the run method to log things mentioned above. We aslo can pass the run method in to a callback to log metrics such las loss_train, loss_test.

```py
with Run(experiment_name=experiment_name, sagemaker_session=sagemaker_session) as run:
    run.log_parameter("batch_size", batch_size)
    run.log_parameter("epochs", epochs)
    run.log_parameter("dropout", dropout)

    run.log_file("datasets/input_train.npy", is_output=False)
    run.log_file("datasets/input_test.npy", is_output=False)
    run.log_file("datasets/input_train_labels.npy", is_output=False)
    run.log_file("datasets/input_test_labels.npy", is_output=False)

    model.fit(
        x_train,
        y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.1,
        callbacks=[ExperimentCallback(run, model, x_test, y_test)]
    )

    score = model.evaluate(x_test, y_test, verbose=0)
    print("test loss: ", score[0])
    print("test accuracy: ", score[1])

    run.log_metric(name="Final test loss: ", value=score[0])
    run.log_metric(name="Final test accuracy: ", value=score[1])

```

The callback

```py
class ExperimentCallback(keras.callbacks.Callback):
    """ """

    def __init__(self, run, model, x_test, y_test):
        """Save params in constructor"""
        self.run = run
        self.model = model
        self.x_test = x_test
        self.y_test = y_test

    def on_epoch_end(self, epoch, logs=None):
        """ """
        keys = list(logs.keys())
        for key in keys:
            self.run.log_metric(name=key, value=logs[key], step=epoch)
            print("{} -> {}".format(key, logs[key]))
```

There are some examples:

- [SageMaker Experiment with Tensorflow](https://github.com/cdk-entest/sagemaker-studio/blob/master/notebook/sg-experiment-tensorflow.ipynb)
- [SageMaker Experiment with PyTorch](https://github.com/cdk-entest/sagemaker-studio/blob/master/notebook/sg-experiment-pytouch.ipynb)

## Reference

- [SageMaker Studio Architecture](https://docs.aws.amazon.com/sagemaker/latest/dg/notebooks.html)

- [Sagemaker life cycle configuration](https://modelpredict.com/sagemaker-stop-your-instances-when-idle/)

- [Sagemaker auto stop](https://github.com/aws-samples/amazon-sagemaker-notebook-instance-lifecycle-config-samples/blob/master/scripts/auto-stop-idle/on-start.sh)

- [Sagemaker instance role](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html#sagemaker-roles-createnotebookinstance-perms)

- [White Paper SageMaker studiouserid](https://docs.aws.amazon.com/whitepapers/latest/sagemaker-studio-admin-best-practices/identity-management.html)

- [SageMaker studiouserid tag](https://docs.aws.amazon.com/whitepapers/latest/sagemaker-studio-admin-best-practices/permissions-management.html)

- [SageMaker Life Cycle Configuration](https://aws.amazon.com/blogs/machine-learning/customize-amazon-sagemaker-studio-using-lifecycle-configurations/)

- [SageMaker Webinar](https://www.youtube.com/watch?v=1iSiN4sVMjE)

- [LSP Life Cycle Configuration](https://github.com/seanpmorgan/studio-notebook-webinar)

- [SageMaker Studio Notebook and Glue Session](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-notebooks-glue.html)
