import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const user = auth.user;
    const getInitials = useInitials();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
        null,
    );

    useEffect(() => {
        return () => {
            if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
            }
        };
    }, [avatarPreviewUrl]);

    if (!user) {
        return null;
    }

    function previewAvatar(file: File | null) {
        setAvatarPreviewUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }

            return file ? URL.createObjectURL(file) : null;
        });
    }

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your name, email address, and avatar"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnSuccess={['avatar']}
                    onSuccess={() => {
                        setAvatarPreviewUrl(null);

                        if (avatarInputRef.current) {
                            avatarInputRef.current.value = '';
                        }
                    }}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, progress, errors }) => (
                        <>
                            <div className="flex flex-col gap-4 rounded-md border bg-card p-4 sm:flex-row sm:items-center">
                                <Avatar className="size-20 rounded-md">
                                    <AvatarImage
                                        src={
                                            avatarPreviewUrl ??
                                            user.avatar ??
                                            undefined
                                        }
                                        alt={user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="grid min-w-0 flex-1 gap-2">
                                    <Label htmlFor="avatar">Avatar</Label>
                                    <Input
                                        id="avatar"
                                        ref={avatarInputRef}
                                        name="avatar"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) =>
                                            previewAvatar(
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <ImagePlus className="size-3.5" />
                                        <span>
                                            JPG, PNG, or WebP up to 2 MB.
                                        </span>
                                    </div>
                                    {progress && (
                                        <progress
                                            value={progress.percentage}
                                            max="100"
                                            className="h-1.5 w-full"
                                        />
                                    )}
                                    <InputError message={errors.avatar} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to resend the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
