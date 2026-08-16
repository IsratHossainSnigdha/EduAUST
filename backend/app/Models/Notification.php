<?php

namespace App\Models;

use Database\Factories\NotificationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An in-app notification shown on the Notifications page.
 *
 * This is deliberately a first-class table rather than Laravel's database
 * notification channel: the page filters and indexes on category, which would
 * otherwise be buried inside a JSON payload.
 */
class Notification extends Model
{
    /** @use HasFactory<NotificationFactory> */
    use HasFactory, HasUuids;

    /**
     * Categories the Notifications page can filter by.
     */
    public const CATEGORY_MESSAGE = 'message';

    public const CATEGORY_REQUEST = 'request';

    public const CATEGORY_SESSION = 'session';

    public const CATEGORY_SYSTEM = 'system';

    /**
     * @var array<int, string>
     */
    public const CATEGORIES = [
        self::CATEGORY_MESSAGE,
        self::CATEGORY_REQUEST,
        self::CATEGORY_SESSION,
        self::CATEGORY_SYSTEM,
    ];

    /**
     * Which dashboard a notification belongs to. One account can act as both a
     * student and a tutor, so AUDIENCE_BOTH covers anything relevant to either.
     */
    public const AUDIENCE_STUDENT = 'student';

    public const AUDIENCE_TUTOR = 'tutor';

    public const AUDIENCE_BOTH = 'both';

    /**
     * Audiences a notification may be stored against.
     *
     * @var array<int, string>
     */
    public const AUDIENCES = [
        self::AUDIENCE_STUDENT,
        self::AUDIENCE_TUTOR,
        self::AUDIENCE_BOTH,
    ];

    /**
     * Audiences a client may ask to view. 'both' is not selectable: it is a
     * storage value meaning "show on either dashboard", not a dashboard.
     *
     * @var array<int, string>
     */
    public const SELECTABLE_AUDIENCES = [
        self::AUDIENCE_STUDENT,
        self::AUDIENCE_TUTOR,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'audience',
        'category',
        'title',
        'body',
        'read_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    /**
     * The recipient of this notification.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Limit the query to notifications the recipient has not read yet.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at');
    }

    /**
     * Limit the query to a single category.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeCategory(Builder $query, string $category): void
    {
        $query->where('category', $category);
    }

    /**
     * Limit the query to one dashboard, including notifications addressed to
     * both. The conditions are nested so the OR cannot leak past any filter
     * already applied to the query.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeForAudience(Builder $query, string $audience): void
    {
        $query->where(function (Builder $scoped) use ($audience) {
            $scoped->where('audience', $audience)
                ->orWhere('audience', self::AUDIENCE_BOTH);
        });
    }

    /**
     * Whether the recipient still has this notification unread.
     */
    public function isUnread(): bool
    {
        return $this->read_at === null;
    }

    /**
     * Mark this notification as read, leaving an already-read one untouched so
     * the original read time is preserved.
     */
    public function markAsRead(): void
    {
        if ($this->isUnread()) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }
}
