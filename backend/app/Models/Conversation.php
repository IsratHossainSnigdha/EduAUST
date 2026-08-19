<?php

namespace App\Models;

use Database\Factories\ConversationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A private thread between exactly two users.
 *
 * Messaging is role-agnostic: the same conversation serves a student writing to
 * a tutor and the tutor writing back, so nothing here depends on which
 * dashboard the participant is currently viewing.
 */
class Conversation extends Model
{
    /** @use HasFactory<ConversationFactory> */
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * The messages in this thread, oldest first.
     *
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * The most recent message, for the conversation list preview.
     *
     * @return HasOne<Message, $this>
     */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * Limit to conversations the given user takes part in.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeForUser(Builder $query, string $userId): void
    {
        $query->where(function (Builder $scoped) use ($userId) {
            $scoped->where('user_one_id', $userId)
                ->orWhere('user_two_id', $userId);
        });
    }

    /**
     * Whether the given user takes part in this conversation.
     */
    public function includes(string $userId): bool
    {
        return $this->user_one_id === $userId || $this->user_two_id === $userId;
    }

    /**
     * The other participant, from the point of view of the given user.
     */
    public function counterpartFor(string $userId): ?User
    {
        return $this->user_one_id === $userId ? $this->userTwo : $this->userOne;
    }

    /**
     * Order a pair of user ids canonically.
     *
     * Sorting the pair means a conversation between A and B is stored
     * identically no matter who started it, which is what lets the unique
     * index reject duplicates.
     *
     * @return array{0: string, 1: string}
     */
    public static function orderPair(string $a, string $b): array
    {
        return strcmp($a, $b) <= 0 ? [$a, $b] : [$b, $a];
    }

    /**
     * Fetch the conversation between two users, creating it when absent.
     */
    public static function betweenIds(string $a, string $b): self
    {
        [$one, $two] = self::orderPair($a, $b);

        return self::firstOrCreate([
            'user_one_id' => $one,
            'user_two_id' => $two,
        ]);
    }
}
