import { GetObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET, r2 } from "./client";

/**
 * Download an R2 object's body as a Uint8Array.
 *
 * Used by the AI analyzer to feed image/PDF bytes to Gemini as a multimodal
 * part. Returns the full body in memory — fine for the <=10 MB cap we enforce
 * at upload time, but don't use this for large objects.
 */
export async function getObjectBytes(objectKey: string): Promise<Uint8Array> {
	const response = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: objectKey }));
	if (!response.Body) {
		throw new Error(`R2 object ${objectKey} has no body`);
	}
	return response.Body.transformToByteArray();
}
