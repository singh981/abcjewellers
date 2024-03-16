import { Stack, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
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
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export class PresentationStack extends Stack {
	constructor(scope: Construct, id: string) {
		super(scope, id);
		const prefix = "abcJewellers";
		const domainName = "https://www.abcjewellers.com";

		// S3 bucket for static content
		const bucket = new Bucket(this, `${prefix}Bucket`, {
			websiteIndexDocument: "index.html",
			websiteErrorDocument: "error.html",
			removalPolicy: RemovalPolicy.DESTROY,
			publicReadAccess: true,
			versioned: true,
		});

		// S3 bucket for logs
		const logsBucket = new Bucket(this, `${prefix}LogBucket`, {
			publicReadAccess: false,
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// CloudFront Origin Access Identity
		const originAccessIdentity = new OriginAccessIdentity(this, "OAI");

		// Read access to the OAI
		bucket.grantRead(originAccessIdentity);

		// Domain certificate
		new acm.Certificate(this, `${prefix}Certificate`, {
			domainName: domainName,
			validation: acm.CertificateValidation.fromDns(),
		});

		// CloudFront distribution for the S3 bucket
		const distribution = new CloudFrontWebDistribution(
			this,
			`${prefix}Distribution`,
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
					prefix: `${prefix}_cloudfront/`,
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
			domainName: "mydomain.com",
		});
		new ARecord(this, "SiteAliasRecord", {
			recordName: domainName,
			target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
			zone,
		});
	}
}
