"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { getUploadUrl, recordUpload } from "@/app/(app)/mock-tests/actions";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";
import { cn } from "@/lib/utils";
import {
	ACCEPTED_MIME_TYPES,
	type AcceptedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@/lib/validators/mock-test-upload";

type TestType = "reading" | "writing";

const ACCEPT_ATTR = ACCEPTED_MIME_TYPES.join(",");

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAcceptedMime(type: string): type is AcceptedMimeType {
	return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
}

export function UploadForm() {
	const router = useRouter();
	const inputId = useId();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const t = copy.mockTests.upload;

	const [testType, setTestType] = useState<TestType>("reading");
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onPickFile = (next: File | null) => {
		setError(null);
		if (!next) {
			setFile(null);
			return;
		}
		if (!isAcceptedMime(next.type)) {
			setError(t.errors.unsupported);
			return;
		}
		if (next.size > MAX_FILE_SIZE_BYTES) {
			setError(t.errors.tooLarge);
			return;
		}
		setFile(next);
	};

	const performUpload = async (uploadFile: File) => {
		setError(null);
		setBusy(true);
		try {
			const contentType = uploadFile.type as AcceptedMimeType;
			const presign = await getUploadUrl({
				filename: uploadFile.name,
				contentType,
				testType,
			});
			if (!presign.ok) {
				setError(t.errors.generic);
				return;
			}

			const putResponse = await fetch(presign.signedUrl, {
				method: "PUT",
				headers: { "Content-Type": contentType },
				body: uploadFile,
			});
			if (!putResponse.ok) {
				setError(t.errors.generic);
				return;
			}

			const record = await recordUpload({
				testId: presign.testId,
				objectKey: presign.objectKey,
				testType,
				contentType,
			});
			if (!record.ok) {
				setError(t.errors.generic);
				return;
			}

			router.push(`/mock-tests/${record.testId}`);
		} catch {
			setError(t.errors.generic);
		} finally {
			setBusy(false);
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (!file || busy) return;
				void performUpload(file);
			}}
			className="space-y-6"
		>
			<fieldset className="space-y-2" disabled={busy}>
				<legend className="text-sm font-medium text-text">{t.testTypeLabel}</legend>
				<div className="grid grid-cols-2 gap-2">
					{(["reading", "writing"] as const).map((opt) => (
						<label
							key={opt}
							className={cn(
								"cursor-pointer rounded-md border px-4 py-3 text-center text-sm font-medium transition-colors",
								testType === opt
									? "border-accent bg-accent-subtle text-text"
									: "border-border bg-bg-elevated text-text-secondary hover:bg-bg-subtle",
							)}
						>
							<input
								type="radio"
								name="testType"
								value={opt}
								checked={testType === opt}
								onChange={() => setTestType(opt)}
								className="sr-only"
							/>
							{t.testType[opt]}
						</label>
					))}
				</div>
			</fieldset>

			<div className="space-y-2">
				<label htmlFor={inputId} className="text-sm font-medium text-text">
					{t.fileLabel}
				</label>
				<input
					ref={fileInputRef}
					id={inputId}
					type="file"
					accept={ACCEPT_ATTR}
					disabled={busy}
					onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
					className="sr-only"
				/>
				{!file && (
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={busy}
						className={cn(
							"flex w-full items-center justify-center rounded-md border border-dashed border-border-strong bg-bg-elevated px-4 py-8 text-sm text-text-secondary",
							"hover:bg-bg-subtle hover:text-text disabled:cursor-not-allowed disabled:opacity-50",
						)}
					>
						{t.filePickerCta}
					</button>
				)}
				{file && (
					<div className="flex items-center justify-between rounded-md border border-border bg-bg-elevated px-4 py-3">
						<div className="min-w-0 flex-1 pr-3">
							<p className="truncate text-sm font-medium text-text">{file.name}</p>
							<p className="text-xs text-text-muted">
								{formatBytes(file.size)} · {file.type || "unknown"}
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								onPickFile(null);
								if (fileInputRef.current) fileInputRef.current.value = "";
							}}
							disabled={busy}
							className="text-sm text-text-secondary hover:text-text disabled:opacity-50"
						>
							{t.removeFile}
						</button>
					</div>
				)}
				<p className="text-xs text-text-muted">{t.fileHint}</p>
			</div>

			{error && (
				<div
					role="alert"
					className="rounded-md border border-error/30 bg-error-bg px-4 py-3 text-sm text-error"
				>
					{error}
				</div>
			)}

			<Button
				type="submit"
				disabled={!file || busy}
				className="w-full bg-accent text-text-inverse hover:bg-accent-hover"
			>
				{busy ? t.submitBusy : t.submit}
			</Button>
		</form>
	);
}
