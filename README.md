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

## Data Scientist

- [Turn on sourceIdentity
  ](https://docs.aws.amazon.com/sagemaker/latest/dg/monitor-user-access.html)
- Tag the User Profile in SageMaker domain
- Create a Role, and IAM user for DS from SageMaker console

Tag the user profile in a domain using studiouserid for key and user profile name for value

```json
{
  key: studiouserid,
  value: "default-1684815788251"
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

## Reference

- [SageMaker Studio Architecture](https://docs.aws.amazon.com/sagemaker/latest/dg/notebooks.html)

- [Sagemaker life cycle configuration](https://modelpredict.com/sagemaker-stop-your-instances-when-idle/)

- [Sagemaker auto stop](https://github.com/aws-samples/amazon-sagemaker-notebook-instance-lifecycle-config-samples/blob/master/scripts/auto-stop-idle/on-start.sh)

- [Sagemaker instance role](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html#sagemaker-roles-createnotebookinstance-perms)

- [White Paper SageMaker studiouserid](https://docs.aws.amazon.com/whitepapers/latest/sagemaker-studio-admin-best-practices/identity-management.html)

- [SageMaker studiouserid tag](https://docs.aws.amazon.com/whitepapers/latest/sagemaker-studio-admin-best-practices/permissions-management.html)
