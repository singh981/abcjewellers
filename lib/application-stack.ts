import { Construct } from "constructs";
import { Stack, App, StackProps } from "aws-cdk-lib";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import {
	UserPool,
	VerificationEmailStyle,
	AccountRecovery,
} from "aws-cdk-lib/aws-cognito";
import { PREFIX, SECONDARY_INDEX } from "./constants";

interface ApplicationStackProps extends StackProps {
	table: Table;
}

export class ApplicationStack extends Stack {
	constructor(scope: Construct, id: string, props: ApplicationStackProps) {
		super(scope, id, props);

		// Lambda function
		const lambdaFunction = new Function(this, `${PREFIX}-function`, {
			runtime: Runtime.NODEJS_16_X,
			code: Code.fromAsset("lambda"),
			handler: "index.handler",
			environment: {
				TABLE_NAME: props.table.tableName,
				SECONDARY_INDEX,
			},
		});

		// Grant the Lambda function read/write permissions to the DynamoDB table
		props.table.grantReadWriteData(lambdaFunction);

		// API Gateway
		const api = new HttpApi(this, `${PREFIX}-api`);
		api.addRoutes({
			path: "/items",
			methods: [HttpMethod.GET, HttpMethod.POST],
			integration: new HttpLambdaIntegration(
				`${PREFIX}/items`,
				lambdaFunction
			),
		});

		// Item level route
		api.addRoutes({
			path: "/items/{id}",
			methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
			integration: new HttpLambdaIntegration(
				`${PREFIX}/items/id`,
				lambdaFunction
			),
		});

		// Cognito User Pool
		const userPool = new UserPool(this, `${PREFIX}-userpool`, {
			selfSignUpEnabled: true,
			accountRecovery: AccountRecovery.EMAIL_ONLY,
			userVerification: {
				emailStyle: VerificationEmailStyle.CODE,
			},
			autoVerify: { email: true },
		});
	}
}
