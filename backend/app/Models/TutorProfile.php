<?php

namespace App\Models;

use Database\Factories\TutorProfileFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A user's public tutoring profile, as listed on the Find Tutor page.
 *
 * Name, department and avatar deliberately live on the user record; this model
 * only carries what is specific to tutoring.
 */
class TutorProfile extends Model
{
    /** @use HasFactory<TutorProfileFactory> */
    use HasFactory, HasUuids;

    /**
     * Sort orders the listing accepts.
     */
    public const SORT_EXPERIENCE = 'experience';

    public const SORT_STUDENTS = 'students';

    public const SORT_RATE_ASC = 'rate_asc';

    public const SORT_RATE_DESC = 'rate_desc';

    public const SORT_NEWEST = 'newest';

    /**
     * @var array<int, string>
     */
    public const SORTS = [
        self::SORT_EXPERIENCE,
        self::SORT_STUDENTS,
        self::SORT_RATE_ASC,
        self::SORT_RATE_DESC,
        self::SORT_NEWEST,
    ];

    public const DEFAULT_SORT = self::SORT_STUDENTS;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'headline',
        'bio',
        'hourly_rate',
        'experience_years',
        'student_count',
        'languages',
        'is_available',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'languages' => 'array',
            'is_available' => 'boolean',
            'hourly_rate' => 'integer',
            'experience_years' => 'integer',
            'student_count' => 'integer',
        ];
    }

    /**
     * The user this profile belongs to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The subjects this tutor teaches.
     *
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class);
    }

    /**
     * Limit to profiles that belong on the public listing.
     *
     * A tutor must be taking students and their account must be verified, so
     * an unverified account cannot advertise itself.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeListable(Builder $query): void
    {
        $query->where('is_available', true)
            ->whereHas('user', fn (Builder $user) => $user->whereNotNull('email_verified_at'));
    }

    /**
     * Match a free-text term against the tutor's name or their subjects.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $like = '%'.$this->escapeLike($term).'%';

        $query->where(function (Builder $scoped) use ($like) {
            $scoped->whereHas('user', fn (Builder $user) => $user->where('name', 'like', $like))
                ->orWhereHas('subjects', fn (Builder $subject) => $subject->where('name', 'like', $like));
        });
    }

    /**
     * Limit to tutors who teach a given subject.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeTeaching(Builder $query, int $subjectId): void
    {
        $query->whereHas('subjects', fn (Builder $subject) => $subject->whereKey($subjectId));
    }

    /**
     * Limit to tutors in a given department, which is a property of the user.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeInDepartment(Builder $query, int $departmentId): void
    {
        $query->whereHas('user', fn (Builder $user) => $user->where('department_id', $departmentId));
    }

    /**
     * Limit to tutors who teach in a given language.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeSpeaking(Builder $query, string $language): void
    {
        $query->whereJsonContains('languages', $language);
    }

    /**
     * Apply one of the supported sort orders.
     *
     * A unique tiebreaker is always appended: without one, rows that share a
     * sort value can shuffle between pages and be duplicated or skipped.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeSorted(Builder $query, string $sort): void
    {
        match ($sort) {
            self::SORT_EXPERIENCE => $query->orderByDesc('experience_years'),
            self::SORT_RATE_ASC => $query->orderBy('hourly_rate'),
            self::SORT_RATE_DESC => $query->orderByDesc('hourly_rate'),
            self::SORT_NEWEST => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('student_count'),
        };

        $query->orderBy('id');
    }

    /**
     * Neutralise LIKE wildcards so a term such as "%" cannot match everything.
     */
    private function escapeLike(string $term): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $term);
    }
}
