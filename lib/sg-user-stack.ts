import { Stack, StackProps, aws_iam, aws_sagemaker } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface SgUserProps extends StackProps {
  username: string;
  domainId: string;
}

export class SgUserStack extends Stack {
  constructor(scope: Construct, id: string, props: SgUserProps) {
    super(scope, id, props);

    const role = new aws_iam.Role(this, "RoleForDataScientistUserProfile", {
      roleName: "RoleForDataScientistUserProfile",
      assumedBy: new aws_iam.CompositePrincipal(
        new aws_iam.ServicePrincipal("states.amazonaws.com"),
        new aws_iam.ServicePrincipal("sagemaker.amazonaws.com")
      ),
    });

    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonSageMakerFullAccess"
      )
    );

    // logs
    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "CloudWatchEventsFullAccess"
      )
    );

    // create pipeline using stepfunction
    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AWSStepFunctionsFullAccess"
      )
    );

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["s3:*"],
      })
    );

    new aws_sagemaker.CfnUserProfile(this, "DataScientistSageMaker", {
      domainId: props.domainId,
      userProfileName: "DataScientistSageMaker",

      // singleSignOnUserIdentifier: "UserName",
      // singleSignOnUserValue: "",

      userSettings: {
        executionRole: role.roleArn,

        // jupyter server app
        jupyterServerAppSettings: {
          defaultResourceSpec: {
            // instanceType: "ml.t3.medium",
            // sageMakerImageArn: "",
            // sageMakerImageVersionArn: "",
          },
        },

        // kernel gateway
        kernelGatewayAppSettings: {
          defaultResourceSpec: {
            instanceType: "ml.t3.medium",
            // sageMakerImageArn: "",
            // sageMakerImageVersionArn: "",
          },
        },

        //
      },
    });
  }
}
