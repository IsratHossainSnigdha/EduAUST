<?php

namespace App\Models;

use Database\Factories\TuitionRequestFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     * The states a tutor may move a request into.
     */
    public const RESPONSES = [
        self::STATUS_ACCEPTED,
        self::STATUS_DECLINED,
    ];

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
