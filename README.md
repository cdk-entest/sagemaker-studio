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

![studio-components (1)](https://github.com/cdk-entest/sagemaker-studio/assets/20411077/79955a11-71f5-4591-9b40-05c7811faa26)

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

- Select correct environment
- Install wanted packages
- Pre-installed by life cycle configuration

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

## SageMaker Hyper Parameters

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
