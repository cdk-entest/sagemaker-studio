#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/network-stack";
import { SgNotebookStack } from "../lib/sg-notebook-stack";
import { SgDomainStack } from "../lib/sg-domain-stack";
import { SgUserStack } from "../lib/sg-user-stack";
import { DataScientistStack } from "../lib/sg-data-scientist";
import { RoleForDataScientistStack } from "../lib/sg-role-ds-iam-user";

const app = new cdk.App();

const vpc = new VpcStack(app, "VpcStack", {
  name: "VpcForSagemaker",
  cidr: "10.0.0.0/16",
});

const notebook = new SgNotebookStack(app, "SagemakerNotebookStack", {
  subnetId: vpc.sagemakerSubnetId,
  securityGroupId: vpc.sagemakerSecurityGroup.securityGroupId,
});

const domain = new SgDomainStack(app, "SageMakerDomainStack", {
  vpcId: vpc.vpc.vpcId,
  subnetId: vpc.sagemakerSubnetId,
  securityGroupId: vpc.sagemakerSecurityGroup.securityGroupId,
});

const userProfile = new SgUserStack(app, "SageMakerUserProfile", {
  domainId: domain.domainId,
  username: "DataScientist",
});

new RoleForDataScientistStack(app, "RoleForDataScientistStack", {
  userName: "AllDataScientist",
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

const tcbDataScientist = new DataScientistStack(app, "DataScientistTCBStack", {
  userName: "tcb",
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

const hauDataScientist = new DataScientistStack(app, "DataScientistHauStack", {
  userName: "hau",
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

notebook.addDependency(vpc);
domain.addDependency(vpc);
userProfile.addDependency(domain);
