import { Stack, RemovalPolicy } from "aws-cdk-lib";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DataTierStack extends Stack {
	public readonly table: Table;

	constructor(scope: Construct, id: string) {
		super(scope, id);
		const prefix = "abcJewellers";

		// DynamoDB table
		this.table = new Table(this, `${prefix}Table`, {
			partitionKey: { name: "id", type: AttributeType.STRING },
			sortKey: { name: "category", type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.RETAIN,
		});

		this.table.addGlobalSecondaryIndex({
			indexName: "categoryIndex",
			partitionKey: { name: "category", type: AttributeType.STRING },
		});
	}
}
