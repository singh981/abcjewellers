import { Construct } from "constructs";
import { Stack, RemovalPolicy } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
	CloudFrontWebDistribution,
	PriceClass,
	OriginAccessIdentity,
	HttpVersion,
} from "aws-cdk-lib/aws-cloudfront";
import {
	ARecord,
	RecordTarget,
	PublicHostedZone,
} from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { PREFIX, DOMAIN_NAME } from "./constants";

export class PresentationStack extends Stack {
	constructor(scope: Construct, id: string) {
		super(scope, id);

		// S3 bucket for static content
		const bucket = new Bucket(this, `${PREFIX}`, {
			websiteIndexDocument: "index.html",
			websiteErrorDocument: "error.html",
			removalPolicy: RemovalPolicy.DESTROY,
			publicReadAccess: true,
			versioned: true,
		});

		// S3 bucket for logs
		const logsBucket = new Bucket(this, `${PREFIX}-logs`, {
			publicReadAccess: false,
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// CloudFront Origin Access Identity
		const originAccessIdentity = new OriginAccessIdentity(this, "OAI");

		// Read access to the OAI
		bucket.grantRead(originAccessIdentity);

		// Domain certificate
		new Certificate(this, `${PREFIX}-certificate`, {
			domainName: DOMAIN_NAME,
			validation: CertificateValidation.fromDns(),
		});

		// CloudFront distribution for the S3 bucket
		const distribution = new CloudFrontWebDistribution(
			this,
			`${PREFIX}-distribution`,
			{
				defaultRootObject: "index.html",
				originConfigs: [
					{
						s3OriginSource: {
							s3BucketSource: bucket,
							originAccessIdentity,
						},
						behaviors: [{ isDefaultBehavior: true }],
					},
				],
				httpVersion: HttpVersion.HTTP2,
				priceClass: PriceClass.PRICE_CLASS_100,
				loggingConfig: {
					bucket: logsBucket,
					includeCookies: true,
					prefix: `${PREFIX}_cloudfront/`,
				},
				errorConfigurations: [
					{
						errorCode: 404,
						responsePagePath: "error.html",
						responseCode: 200,
					},
				],
			}
		);

		// Route53 record to route traffic
		const zone = PublicHostedZone.fromLookup(this, "Zone", {
			domainName: DOMAIN_NAME,
		});

		// Alias record for the CloudFront distribution
		new ARecord(this, "SiteAliasRecord", {
			recordName: DOMAIN_NAME,
			target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
			zone,
		});
	}
}
