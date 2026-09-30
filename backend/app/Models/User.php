<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'student_id',
        'email',
        'phone',
        'department_id',
        'semester',
        'profile_picture',
        'password',
        'isTutor',
        'email_verified_at',
        'google_id',
        'google_linked_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'isTutor' => 'boolean',
            'google_linked_at' => 'datetime',
            'notification_preferences' => 'array',
        ];
    }

    /**
     * The kinds of notification an account can switch off, keyed by the name
     * the settings screen uses, each mapped to the category it covers.
     */
    public const NOTIFICATION_TOPICS = [
        'messages' => Notification::CATEGORY_MESSAGE,
        'requests' => Notification::CATEGORY_REQUEST,
        'sessions' => Notification::CATEGORY_SESSION,
        'system' => Notification::CATEGORY_SYSTEM,
    ];

    /**
     * Every topic and whether it is on.
     *
     * Only topics someone has turned off are ever stored, so anything missing,
     * including a topic added later, counts as on.
     *
     * @return array<string, bool>
     */
    public function notificationPreferences(): array
    {
        $stored = $this->notification_preferences ?? [];

        $preferences = [];

        foreach (array_keys(self::NOTIFICATION_TOPICS) as $topic) {
            $preferences[$topic] = (bool) ($stored[$topic] ?? true);
        }

        return $preferences;
    }

    /**
     * Whether this account wants to be told about a notification category.
     */
    public function wantsNotificationsAbout(string $category): bool
    {
        $topic = array_search($category, self::NOTIFICATION_TOPICS, true);

        // A category nobody can switch off is always delivered.
        if ($topic === false) {
            return true;
        }

        return $this->notificationPreferences()[$topic];
    }

    /**
     * Whether the account can sign in with an email and password.
     *
     * Accounts created through Google have no password until the holder sets
     * one, so this is what the settings screen reports.
     */
    public function hasPassword(): bool
    {
        return filled($this->password);
    }

    /**
     * Whether a Google account is linked to this one.
     */
    public function hasGoogleLinked(): bool
    {
        return filled($this->google_id);
    }

    /**
     * Whether the account has cleared the checks required to sign in and use
     * authenticated features.
     *
     * Registration only persists a user once the emailed code has been
     * confirmed, so this also guards accounts created by other means.
     */
    public function canSignIn(): bool
    {
        return $this->hasVerifiedEmail();
    }

    /**
     * This user's public tutoring profile, if they tutor at all.
     *
     * @return HasOne<TutorProfile, $this>
     */
    public function tutorProfile(): HasOne
    {
        return $this->hasOne(TutorProfile::class);
    }

    /**
     * The in-app notifications addressed to this user, newest first.
     *
     * This intentionally replaces the morphMany that the Notifiable trait
     * provides, because notifications are stored as a first-class table with
     * their own columns rather than through Laravel's database channel.
     *
     * @return HasMany<Notification, $this>
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class)->latest();
    }

    /**
     * The department the user belongs to.
     *
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
