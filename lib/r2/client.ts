import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 client (S3-compatible).
 *
 * Region "auto" is the canonical R2 value — actual location is set on the bucket
 * (Asia-Pacific hint per Session 6 setup). Endpoint uses the account ID, not the
 * bucket name; bucket is specified per-operation via `Bucket` param.
 */

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
	throw new Error(
		"R2 credentials missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.",
	);
}

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: { accessKeyId, secretAccessKey },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "mnemo-uploads";
