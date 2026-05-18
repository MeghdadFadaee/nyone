<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Translation\PotentiallyTranslatedString;

class SupportAttachmentFile implements ValidationRule
{
    private const MAX_UPLOAD_KILOBYTES = 204800;

    private const ALLOWED_MIME_TYPES = [
        'image/*',
        'video/*',
        'audio/*',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/csv',
        'application/json',
        'application/x-ndjson',
        'text/json',
        'application/xml',
        'text/xml',
        'text/markdown',
        'application/x-yaml',
        'text/yaml',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-7z-compressed',
        'application/vnd.rar',
        'application/x-rar-compressed',
        'application/x-tar',
        'application/gzip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'text/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
    ];

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $validator = Validator::make(
            ['attachment' => $value],
            [
                'attachment' => [
                    'file',
                    'max:'.self::MAX_UPLOAD_KILOBYTES,
                    'mimetypes:'.implode(',', self::ALLOWED_MIME_TYPES),
                ],
            ],
            [
                'attachment.file' => __('Attachment upload failed. Try the file again or choose a different file.'),
                'attachment.max' => __('Attachments must be 200 MB or smaller.'),
                'attachment.mimetypes' => __('Unsupported attachment type. Upload media, PDF, text/data, Office, OpenDocument, or archive files.'),
            ],
        );

        if ($validator->fails()) {
            $fail($validator->errors()->first('attachment'));
        }
    }
}
