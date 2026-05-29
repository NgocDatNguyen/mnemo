import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET, r2 } from "./client";

/**
 * Object existence + metadata via HEAD. Returns null if the object is absent (404
 * surfaces as a NotFound/NoSuchKey error). Used by upload hardening to confirm the
 * browser→R2 direct upload actually landed before we trust a client-reported key.
 */
export async function headObject(
	objectKey: string,
): Promise<{ contentType?: string; contentLength?: number } | null> {
	try {
		const res = await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: objectKey }));
		return { contentType: res.ContentType, contentLength: res.ContentLength };
	} catch (err) {
		const name = (err as { name?: string })?.name ?? "";
		if (name === "NotFound" || name === "NoSuchKey") return null;
		throw err;
	}
}

/** Delete an R2 object. Idempotent (S3 delete of a missing key is a no-op success). */
export async function deleteObject(objectKey: string): Promise<void> {
	await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: objectKey }));
}
