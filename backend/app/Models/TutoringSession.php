<?php

namespace App\Models;

use Database\Factories\TutoringSessionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An agreed time for a tutor and a student to meet.
 *
 * One side proposes, the other agrees. Nothing is "booked" until both have
 * said so, because a session in a diary that only one person accepted is
 * worse than no session at all.
 */
class TutoringSession extends Model
{
    /** @use HasFactory<TutoringSessionFactory> */
    use HasFactory, HasUuids;

    /**
     * Suggested by one side, waiting on the other.
     */
    public const STATUS_PROPOSED = 'proposed';

    /**
     * Both sides have agreed to it.
     */
    public const STATUS_CONFIRMED = 'confirmed';

    /**
     * Called off by either side, whether or not it had been confirmed.
     */
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Its time has passed and it was not cancelled.
     */
    public const STATUS_COMPLETED = 'completed';

    /**
     * Statuses that still describe something expected to happen.
     */
    public const LIVE_STATUSES = [
        self::STATUS_PROPOSED,
        self::STATUS_CONFIRMED,
    ];

    /**
     * How far ahead a session may be arranged.
     *
     * Long enough for a whole semester, short enough that a typo in the year
     * is rejected rather than quietly accepted.
     */
    public const MAX_MONTHS_AHEAD = 6;

    /**
     * The shortest and longest a single sitting may be.
     */
    public const MIN_MINUTES = 15;

    public const MAX_MINUTES = 480;

    protected $fillable = [
        'tuition_request_id',
        'tutor_id',
        'student_id',
        'scheduled_at',
        'duration_minutes',
        'location',
        'note',
        'status',
        'proposed_by',
        'cancelled_at',
        'cancelled_by',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'duration_minutes' => 'integer',
        ];
    }

    /**
     * The arrangement this session belongs to.
     *
     * @return BelongsTo<TuitionRequest, $this>
     */
    public function tuitionRequest(): BelongsTo
    {
        return $this->belongsTo(TuitionRequest::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Limit to sessions involving this account, on either side of it.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeForUser(Builder $query, string $userId): void
    {
        $query->where(function (Builder $q) use ($userId) {
            $q->where('tutor_id', $userId)->orWhere('student_id', $userId);
        });
    }

    /**
     * Limit to sessions still expected to happen.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeUpcoming(Builder $query): void
    {
        $query->whereIn('status', self::LIVE_STATUSES)
            ->where('scheduled_at', '>=', now());
    }

    /**
     * When the session is expected to finish.
     */
    public function endsAt(): Carbon
    {
        return $this->scheduled_at->copy()->addMinutes($this->duration_minutes);
    }

    /**
     * Whether this session's time has come and gone.
     */
    public function isPast(): bool
    {
        return $this->endsAt()->isPast();
    }

    /**
     * Whether this account is the one being asked to agree.
     *
     * The side that proposed a session does not get to confirm it on the
     * other's behalf; that would make agreement meaningless.
     */
    public function awaitingAnswerFrom(string $userId): bool
    {
        return $this->status === self::STATUS_PROPOSED
            && $this->proposed_by !== $userId
            && $this->involves($userId);
    }

    /**
     * Whether this account is on either side of the session.
     */
    public function involves(string $userId): bool
    {
        return $this->tutor_id === $userId || $this->student_id === $userId;
    }

    /**
     * The other person, as seen by this one.
     */
    public function counterpartFor(string $userId): ?User
    {
        if ($userId === $this->tutor_id) {
            return $this->student;
        }

        if ($userId === $this->student_id) {
            return $this->tutor;
        }

        return null;
    }

    /**
     * The status to report, treating a passed session as done.
     *
     * Nothing sweeps the table to mark sessions complete, so a confirmed
     * session whose time has passed would otherwise still read "confirmed"
     * forever.
     */
    public function effectiveStatus(): string
    {
        if ($this->status === self::STATUS_CONFIRMED && $this->isPast()) {
            return self::STATUS_COMPLETED;
        }

        return $this->status;
    }
}
