<?php

namespace App\Models;

use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Subject extends Model
{
    /** @use HasFactory<SubjectFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * Keep the slug in step with the name so callers only have to set one.
     */
    protected static function booted(): void
    {
        static::saving(function (Subject $subject) {
            if (blank($subject->slug) && filled($subject->name)) {
                $subject->slug = Str::slug($subject->name);
            }
        });
    }

    /**
     * The tutors who teach this subject.
     *
     * @return BelongsToMany<TutorProfile, $this>
     */
    public function tutorProfiles(): BelongsToMany
    {
        return $this->belongsToMany(TutorProfile::class);
    }
}
