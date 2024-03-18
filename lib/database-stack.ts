import { Construct } from "constructs";
import { Stack, RemovalPolicy } from "aws-cdk-lib";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { PREFIX, SECONDARY_INDEX } from "./constants";

export class DataTierStack extends Stack {
	public readonly table: Table;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		// DynamoDB table
		this.table = new Table(this, `${PREFIX}-table`, {
			partitionKey: { name: "id", type: AttributeType.STRING },
			sortKey: { name: "category", type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.RETAIN,
		});

		this.table.addGlobalSecondaryIndex({
			indexName: SECONDARY_INDEX,
			partitionKey: { name: "category", type: AttributeType.STRING },
		});
	}
}
