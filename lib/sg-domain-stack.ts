import { Stack, StackProps, aws_iam, aws_sagemaker } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface SgDomainProps extends StackProps {
  vpcId: string;
  subnetId: string;
  securityGroupId: string;
}

export class SgDomainStack extends Stack {
  public readonly domainId: string;

  constructor(scope: Construct, id: string, props: SgDomainProps) {
    super(scope, id, props);

    const lifecycleKernelGatewayArn =
      "arn:aws:sagemaker:ap-southeast-1:014600194779:studio-lifecycle-config/test";
    const lifecycleJupyterServerArn =
      "arn:aws:sagemaker:ap-southeast-1:014600194779:studio-lifecycle-config/auto-stop-app";

    // role for user
    const role = new aws_iam.Role(this, "RoleForUserProfileDemo", {
      roleName: "RoleForUserProfileDemo",
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
    const policy = new aws_iam.Policy(this, "PolicyForUserProfileDemo", {
      policyName: "PolicyForUserProfileDemo",
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

    const domain = new aws_sagemaker.CfnDomain(this, "SageMakerDomainDemo", {
      authMode: "IAM",
      domainName: "SageMakerDomainDemo",
      subnetIds: [props.subnetId],
      vpcId: props.vpcId,
      appNetworkAccessType: "PublicInternetOnly",
      // appSecurityGroupManagement: "",

      domainSettings: {
        securityGroupIds: [props.securityGroupId],
      },

      defaultUserSettings: {
        executionRole: role.roleArn,

        jupyterServerAppSettings: {
          defaultResourceSpec: {
            // instanceType: "ml.t3.medium",
            lifecycleConfigArn: lifecycleJupyterServerArn,
            // sageMakerImageArn: "",
            // sageMakerImageVersionArn: "",
          },
        },

        kernelGatewayAppSettings: {
          // customImages: [
          //   {
          //     appImageConfigName: "",
          //     imageName: "",
          //     imageVersionNumber: 123,
          //   },
          // ],

          defaultResourceSpec: {
            instanceType: "ml.t3.medium",
            lifecycleConfigArn: lifecycleKernelGatewayArn,
            // sageMakerImageArn: "",
            // sageMakerImageVersionArn: "",
          },
        },
      },
    });

    this.domainId = domain.attrDomainId;
  }
}
