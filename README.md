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

Figure

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

## Reference

- [SageMaker Studio Architecture](https://docs.aws.amazon.com/sagemaker/latest/dg/notebooks.html)

- [Sagemaker life cycle configuration](https://modelpredict.com/sagemaker-stop-your-instances-when-idle/)

- [Sagemaker auto stop](https://github.com/aws-samples/amazon-sagemaker-notebook-instance-lifecycle-config-samples/blob/master/scripts/auto-stop-idle/on-start.sh)

- [Sagemaker instance role](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html#sagemaker-roles-createnotebookinstance-perms)

- [White Paper SageMaker studiouserid](https://docs.aws.amazon.com/whitepapers/latest/sagemaker-studio-admin-best-practices/identity-management.html)

- [SageMaker studiouserid tag](https://docs.aws.amazon.com/whitepapers/latest/sagemaker-studio-admin-best-practices/permissions-management.html)

- [SageMaker Life Cycle Configuration](https://aws.amazon.com/blogs/machine-learning/customize-amazon-sagemaker-studio-using-lifecycle-configurations/)
