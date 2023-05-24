import { Stack, StackProps, aws_iam, aws_sagemaker } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface SagemakerProps extends StackProps {
  subnetId: string;
  securityGroupId: string;
}

export class SgNotebookStack extends Stack {
  constructor(scope: Construct, id: string, props: SagemakerProps) {
    super(scope, id, props);

    // role for notebook
    const role = new aws_iam.Role(this, "RoleForSagemakerNotebookHello", {
      roleName: "RoleForSagemakerNotebookHello",
      assumedBy: new aws_iam.CompositePrincipal(
        new aws_iam.ServicePrincipal("sagemaker.amazonaws.com"),
        new aws_iam.ServicePrincipal("states.amazonaws.com")
      ),
    });

    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonSageMakerFullAccess"
      )
    );

    // create a policy for the notebook role
    const policy = new aws_iam.Policy(this, "PolicyForSagemakerNotebookHello", {
      policyName: "PolicyForSagemakerNotebookHello",
      statements: [
        new aws_iam.PolicyStatement({
          actions: ["s3:*"],
          effect: Effect.ALLOW,
          resources: ["*"],
        }),

        new aws_iam.PolicyStatement({
          actions: ["logs:*"],
          effect: Effect.ALLOW,
          resources: ["*"],
        }),
      ],
    });

    policy.attachToRole(role);

    // notebook lifecycle configuration
    const lifecycle = new aws_sagemaker.CfnNotebookInstanceLifecycleConfig(
      this,
      "LifeCycleForNoteBookHello",
      {
        notebookInstanceLifecycleConfigName: "LifeCycleForNoteBookHello",
        onCreate: [{}],
        onStart: [{}],
      }
    );

    new aws_sagemaker.CfnNotebookInstance(this, "NotebookInstanceDemo", {
      instanceType: "ml.m4.xlarge",
      roleArn: role.roleArn,
      directInternetAccess: "Enabled",
      instanceMetadataServiceConfiguration: {
        minimumInstanceMetadataServiceVersion: "2",
      },
      lifecycleConfigName: lifecycle.attrNotebookInstanceLifecycleConfigName,
      notebookInstanceName: "hello-notebook",
      platformIdentifier: "notebook-al2-v2",
      rootAccess: "Enabled",
      securityGroupIds: [props.securityGroupId],
      subnetId: props.subnetId,
      volumeSizeInGb: 128,
    });
  }
}
