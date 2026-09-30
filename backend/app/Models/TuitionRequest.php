<?php

namespace App\Models;

use Database\Factories\TuitionRequestFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A student's request for a particular tutor to teach a particular subject.
 */
class TuitionRequest extends Model
{
    /** @use HasFactory<TuitionRequestFactory> */
    use HasFactory, HasUuids;

    /**
     * Waiting for the tutor to respond.
     */
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_DECLINED = 'declined';

    /**
     * A tutoring arrangement the tutor has since closed. The student was
     * taught, so they still count towards "taught", but the tutor is no
     * longer teaching them and messaging is no longer open.
     */
    public const STATUS_ENDED = 'ended';

    /**
     * A request the student took back before the tutor answered it.
     *
     * Distinct from declined, which is the tutor's decision, and from ended,
     * which means teaching actually happened.
     */
    public const STATUS_WITHDRAWN = 'withdrawn';

    /**
     * The states a tutor may move a request into.
     */
    public const RESPONSES = [
        self::STATUS_ACCEPTED,
        self::STATUS_DECLINED,
    ];

    /**
     * Statuses that mean the student was, at some point, taught by the tutor.
     */
    public const TAUGHT_STATUSES = [
        self::STATUS_ACCEPTED,
        self::STATUS_ENDED,
    ];

    /**
     * How long a student commits to before they may walk away.
     *
     * The two sides are deliberately not symmetric. A tutor may end an
     * arrangement whenever they need to: they are giving their own time, and
     * forcing them to keep teaching helps nobody. A student is asking someone
     * to set that time aside, so they commit to a full month before they can
     * drop it, which is what stops a tutor's schedule being churned.
     */
    public const STUDENT_COMMITMENT_MONTHS = 1;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'tutor_id',
        'subject_id',
        'level',
        'message',
        'status',
        'seen_at',
        'responded_at',
        'ended_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'seen_at' => 'datetime',
            'responded_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /**
     * The student who sent the request.
     *
     * @return BelongsTo<User, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * The tutor the request was sent to.
     *
     * @return BelongsTo<User, $this>
     */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * The subject the student wants taught.
     *
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Limit to requests still awaiting an answer.
     *
     * @param  Builder<$this>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Whether the tutor has already answered this request.
     */
    public function isAnswered(): bool
    {
        return $this->status !== self::STATUS_PENDING;
    }

    /**
     * Whether these two accounts have an accepted request between them, in
     * either direction.
     *
     * This is what unlocks messaging: a tutor agreeing to teach is the
     * introduction, so students cannot message tutors uninvited.
     */
    /**
     * Distinct students a tutor is teaching right now (accepted, not ended).
     */
    public static function currentlyTeaching(string $tutorId): int
    {
        return (int) self::query()
            ->where('tutor_id', $tutorId)
            ->where('status', self::STATUS_ACCEPTED)
            ->distinct()
            ->count('student_id');
    }

    /**
     * Distinct students a tutor has ever taught (accepted or since ended).
     */
    public static function studentsTaught(string $tutorId): int
    {
        return (int) self::query()
            ->where('tutor_id', $tutorId)
            ->whereIn('status', self::TAUGHT_STATUSES)
            ->distinct()
            ->count('student_id');
    }

    /**
     * When the teaching actually began, which is when the tutor accepted.
     */
    public function startedAt(): ?Carbon
    {
        return $this->responded_at;
    }

    /**
     * The earliest the student may end this arrangement themselves.
     *
     * Null when there is no start date to count from, in which case there is
     * no commitment to enforce.
     */
    public function studentMayEndAt(): ?Carbon
    {
        return $this->startedAt()?->copy()->addMonths(self::STUDENT_COMMITMENT_MONTHS);
    }

    /**
     * Whether the student's committed month has run.
     */
    public function studentMayEnd(): bool
    {
        $due = $this->studentMayEndAt();

        // Nothing to count from is not a reason to trap them.
        return $due === null || now()->greaterThanOrEqualTo($due);
    }

    /**
     * Whether this account may end the arrangement right now, and why not.
     *
     * @return array{allowed: bool, reason: ?string}
     */
    public function endableBy(string $userId): array
    {
        if ($userId === $this->tutor_id) {
            // A tutor is giving their own time and may stop at any point.
            return ['allowed' => true, 'reason' => null];
        }

        if ($userId !== $this->student_id) {
            return ['allowed' => false, 'reason' => 'This is not your arrangement.'];
        }

        if ($this->studentMayEnd()) {
            return ['allowed' => true, 'reason' => null];
        }

        $due = $this->studentMayEndAt();

        return [
            'allowed' => false,
            'reason' => 'You can end this arrangement from '
                .$due->toFormattedDateString()
                .', once your first month with this tutor is complete.',
        ];
    }

    public static function acceptedBetween(string $a, string $b): bool
    {
        return self::query()
            ->where('status', self::STATUS_ACCEPTED)
            ->where(function (Builder $query) use ($a, $b) {
                $query->where(fn (Builder $q) => $q->where('student_id', $a)->where('tutor_id', $b))
                    ->orWhere(fn (Builder $q) => $q->where('student_id', $b)->where('tutor_id', $a));
            })
            ->exists();
    }
}
