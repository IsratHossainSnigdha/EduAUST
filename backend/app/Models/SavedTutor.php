<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A tutor a student has kept on their shortlist while browsing.
 *
 * Saving is deliberately separate from sending a request: a student can keep
 * several tutors in mind and ask one of them later.
 */
class SavedTutor extends Model
{
    use HasUuids;

    protected $table = 'saved_tutors';

    protected $fillable = [
        'student_id',
        'tutor_id',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
