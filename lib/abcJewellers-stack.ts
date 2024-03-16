import { Stack, App, RemovalPolicy, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PresentationStack } from "./presentation-stack";
import { DataTierStack } from "./database-stack";
import { ApplicationStack } from "./application-stack";

export class AbcJewellersStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		new PresentationStack(this, "PresentationStack");

		const dataStackInstance = new DataTierStack(this, "DataTierStack");

		new ApplicationStack(this, "ApplicationStack", {
			table: dataStackInstance.table,
		});
	}
}
