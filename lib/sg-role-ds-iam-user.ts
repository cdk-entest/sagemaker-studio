import { aws_iam, aws_secretsmanager, Stack, StackProps } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface RoleForDataScientistProps extends StackProps {
  userName: string;
}

export class RoleForDataScientistStack extends Stack {
  public userArn: string;

  constructor(scope: Construct, id: string, props: RoleForDataScientistProps) {
    super(scope, id, props);

    const role = new aws_iam.Role(
      this,
      `RoleForDataScientistIAMUser_${props.userName}`,
      {
        roleName: `RoleForDataScientistIAMUser_${props.userName}`,
        assumedBy: new aws_iam.CompositePrincipal(
          new aws_iam.ServicePrincipal("sagemaker.amazonaws.com"),
          new aws_iam.ArnPrincipal(`arn:aws:iam::${this.account}:user/hau`)
        ),
      }
    );

    // grant access to athena
    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAthenaFullAccess")
    );

    // grant access to s3
    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
        resources: ["arn:aws:s3:::*"],
      })
    );

    // policy for studio app management
    const smStudioManPolicy = new aws_iam.ManagedPolicy(
      this,
      `SM_StudioManagment_${props.userName}`,
      {
        managedPolicyName: `SM_StudioManagment_${props.userName}`,
        statements: [
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["sagemaker:CreatePresignedDomainUrl"],
            resources: [
              `arn:aws:sagemaker:${this.region}:${this.account}:domain/*`,
              `arn:aws:sagemaker:${this.region}:${this.account}:user-profile/*/*`,
            ],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:CreateApp",
              "sagemaker:CreateAppImageConfig",
              "sagemaker:UpdateAppImageConfig",
              "sagemaker:DeleteApp",
              "sagemaker:DeleteAppImageConfig",
              "sagemaker:DescribeApp",
              "sagemaker:DescribeAppImageConfig",
              "sagemaker:DescribeDomain",
              "sagemaker:DescribeUserProfile",
            ],
            resources: ["arn:aws:sagemaker:*:*:*/*"],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:ListApps",
              "sagemaker:ListAppImageConfigs",
              "sagemaker:ListDomains",
              "sagemaker:ListUserProfiles",
            ],
            resources: ["*"],
          }),
        ],
      }
    );

    // policy for model managment
    const smModelManPolicy = new aws_iam.ManagedPolicy(
      this,
      `SM_ModelManagmentPolicy_${props.userName}`,
      {
        managedPolicyName: `SM_ModelManagmentPolicy_${props.userName}`,
        statements: [
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:CreateModel",
              "sagemaker:CreateModelPackage",
              "sagemaker:CreateModelPackageGroup",
              "sagemaker:DescribeModel",
              "sagemaker:DescribeModelPackage",
              "sagemaker:DescribeModelPackageGroup",
              "sagemaker:BatchDescribeModelPackage",
              "sagemaker:UpdateModelPackage",
              "sagemaker:DeleteModel",
              "sagemaker:DeleteModelPackage",
              "sagemaker:DeleteModelPackageGroup",
            ],
            resources: ["arn:aws:sagemaker:*:*:*/*"],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:ListModels",
              "sagemaker:ListModelPackages",
              "sagemaker:ListModelPackageGroups",
            ],
            resources: ["*"],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["iam:PassRole"],
            resources: ["*"],
            conditions: {
              StringEquals: {
                "iam:PassedToService": "sagemaker.amazonaws.com",
              },
            },
          }),
        ],
      }
    );

    // policy for visual experiment managment
    const smVisualExpManPolicy = new aws_iam.ManagedPolicy(
      this,
      `SM_ExperimentVisualization_${props.userName}`,
      {
        managedPolicyName: `SM_ExperimentVisualization_${props.userName}`,
        statements: [
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:DescribeAction",
              "sagemaker:DescribeArtifact",
              "sagemaker:DescribeContext",
              "sagemaker:DescribeExperiment",
              "sagemaker:DescribeTrial",
              "sagemaker:DescribeTrialComponent",
              "sagemaker:DescribeLineageGroup",
            ],
            resources: ["arn:aws:sagemaker:*:*:*/*"],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:ListAssociations",
              "sagemaker:ListActions",
              "sagemaker:ListArtifacts",
              "sagemaker:ListContexts",
              "sagemaker:ListExperiments",
              "sagemaker:ListTrials",
              "sagemaker:ListTrialComponents",
              "sagemaker:ListLineageGroups",
              "sagemaker:GetLineageGroupPolicy",
              "sagemaker:QueryLineage",
              "sagemaker:Search",
              "sagemaker:GetSearchSuggestions",
            ],
            resources: ["*"],
          }),
        ],
      }
    );

    // policy for experiment management
    const smExperimentManagementPolicy = new aws_iam.ManagedPolicy(
      this,
      `SM_ExperimentManagment_${props.userName}`,
      {
        managedPolicyName: `SM_ExperimentManagment_${props.userName}`,
        statements: [
          new aws_iam.PolicyStatement({
            actions: [
              "sagemaker:AddAssociation",
              "sagemaker:CreateAction",
              "sagemaker:CreateArtifact",
              "sagemaker:CreateContext",
              "sagemaker:CreateExperiment",
              "sagemaker:CreateTrial",
              "sagemaker:CreateTrialComponent",
              "sagemaker:UpdateAction",
              "sagemaker:UpdateArtifact",
              "sagemaker:UpdateContext",
              "sagemaker:UpdateExperiment",
              "sagemaker:UpdateTrial",
              "sagemaker:UpdateTrialComponent",
              "sagemaker:AssociateTrialComponent",
              "sagemaker:DisassociateTrialComponent",
              "sagemaker:DeleteAssociation",
              "sagemaker:DeleteAction",
              "sagemaker:DeleteArtifact",
              "sagemaker:DeleteContext",
              "sagemaker:DeleteExperiment",
              "sagemaker:DeleteTrial",
              "sagemaker:DeleteTrialComponent",
            ],
            effect: Effect.ALLOW,
            resources: ["arn:aws:sagemaker:*:*:*/*"],
          }),
        ],
      }
    );

    // policy to create sagemaker studio app
    const smJobPolicy = new aws_iam.ManagedPolicy(
      this,
      `SM_CommonJobManagement_${props.userName}`,
      {
        managedPolicyName: `SM_CommonJobManagement_${props.userName}`,
        statements: [
          new aws_iam.PolicyStatement({
            actions: [
              "sagemaker:CreateTrainingJob",
              "sagemaker:CreateTransformJob",
              "sagemaker:CreateProcessingJob",
              "sagemaker:CreateAutoMLJob",
              "sagemaker:CreateHyperParameterTuningJob",
              "sagemaker:StopTrainingJob",
              "sagemaker:StopProcessingJob",
              "sagemaker:StopAutoMLJob",
              "sagemaker:StopHyperParameterTuningJob",
              "sagemaker:DescribeTrainingJob",
              "sagemaker:DescribeTransformJob",
              "sagemaker:DescribeProcessingJob",
              "sagemaker:DescribeAutoMLJob",
              "sagemaker:DescribeHyperParameterTuningJob",
              "sagemaker:UpdateTrainingJob",
              "sagemaker:BatchGetMetrics",
            ],
            resources: ["arn:aws:sagemaker:*:*:*/*"],
            effect: Effect.ALLOW,
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "sagemaker:Search",
              "sagemaker:ListTrainingJobs",
              "sagemaker:ListTransformJobs",
              "sagemaker:ListProcessingJobs",
              "sagemaker:ListAutoMLJobs",
              "sagemaker:ListCandidatesForAutoMLJob",
              "sagemaker:ListHyperParameterTuningJobs",
              "sagemaker:ListTrainingJobsForHyperParameterTuningJob",
            ],
            resources: ["*"],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            resources: ["*"],
            actions: ["iam:PassRole"],
            conditions: {
              StringEquals: {
                "iam:PassedToService": "sagemaker.amazonaws.com",
              },
            },
          }),
        ],
      }
    );

    // attach policies to iam role
    smStudioManPolicy.attachToRole(role);
    smModelManPolicy.attachToRole(role);
    smExperimentManagementPolicy.attachToRole(role);
    smVisualExpManPolicy.attachToRole(role);
    smJobPolicy.attachToRole(role);
  }
}
