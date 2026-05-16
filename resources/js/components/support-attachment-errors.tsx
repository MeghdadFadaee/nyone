type Props = {
    errors: Partial<Record<string, string>>;
};

export function SupportAttachmentErrors({ errors }: Props) {
    const messages = Object.entries(errors)
        .filter(
            ([key, message]) =>
                Boolean(message) &&
                (key === 'attachments' || key.startsWith('attachments.')),
        )
        .map(([key, message]) => ({
            key,
            message: message as string,
        }));

    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {messages.map((item) => (
                <div key={item.key}>{item.message}</div>
            ))}
        </div>
    );
}
