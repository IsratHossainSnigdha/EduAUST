<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A rating between a student and a tutor who worked together.
 *
 * It runs both ways: a student rates the tutor who taught them, and a tutor
 * rates a student they taught. `direction` says which, and the same pair can
 * hold one review each way.
 */
class Review extends Model
{
    use HasUuids;

    public const MIN_RATING = 1;

    public const MAX_RATING = 5;

    /** A student rating their tutor. */
    public const STUDENT_TO_TUTOR = 'student_to_tutor';

    /** A tutor rating their student. */
    public const TUTOR_TO_STUDENT = 'tutor_to_student';

    protected $fillable = [
        'student_id',
        'tutor_id',
        'direction',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * Reviews written about a tutor (by their students).
     */
    public function scopeForTutor(Builder $query, string $tutorId): void
    {
        $query->where('tutor_id', $tutorId)->where('direction', self::STUDENT_TO_TUTOR);
    }

    /**
     * Reviews written about a student (by their tutors).
     */
    public function scopeForStudent(Builder $query, string $studentId): void
    {
        $query->where('student_id', $studentId)->where('direction', self::TUTOR_TO_STUDENT);
    }

    /**
     * Whether a tutoring relationship exists that earns a review either way.
     *
     * A review only means something when the two actually worked together, so
     * both directions require an accepted or since-ended arrangement.
     */
    public static function isAllowed(string $studentId, string $tutorId): bool
    {
        return TuitionRequest::query()
            ->where('student_id', $studentId)
            ->where('tutor_id', $tutorId)
            ->whereIn('status', TuitionRequest::TAUGHT_STATUSES)
            ->exists();
    }

    /**
     * A user's rating summary. `direction` picks which side is being rated:
     * STUDENT_TO_TUTOR for a tutor's rating, TUTOR_TO_STUDENT for a student's.
     *
     * @return array{average: float|null, count: int}
     */
    public static function summaryFor(string $userId, string $direction = self::STUDENT_TO_TUTOR): array
    {
        $column = $direction === self::TUTOR_TO_STUDENT ? 'student_id' : 'tutor_id';

        $row = self::query()
            ->where($column, $userId)
            ->where('direction', $direction)
            ->selectRaw('AVG(rating) as average, COUNT(*) as total')
            ->first();

        $count = (int) ($row->total ?? 0);

        return [
            // No reviews is not a rating of zero, which would read as terrible.
            'average' => $count > 0 ? round((float) $row->average, 1) : null,
            'count' => $count,
        ];
    }
}
