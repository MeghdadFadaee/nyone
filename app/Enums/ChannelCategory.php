<?php

namespace App\Enums;

enum ChannelCategory: string
{
    case Gaming = 'gaming';
    case Music = 'music';
    case TalkShows = 'talk-shows';
    case Education = 'education';
    case Creative = 'creative';

    public function label(): string
    {
        return match ($this) {
            self::Gaming => __('Gaming'),
            self::Music => __('Music'),
            self::TalkShows => __('Talk Shows'),
            self::Education => __('Education'),
            self::Creative => __('Creative'),
        };
    }

    /**
     * @return array{value: string, label: string}
     */
    public function toOption(): array
    {
        return [
            'value' => $this->value,
            'label' => $this->label(),
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $category): array => $category->toOption(),
            self::cases(),
        );
    }
}
