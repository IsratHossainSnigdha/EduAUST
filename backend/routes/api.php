<?php

use App\Http\Controllers\Auth\AccountController;
use App\Http\Controllers\Auth\GoogleLoginController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterInfoController;
use App\Http\Controllers\Auth\RegisterSecurityController;
use App\Http\Controllers\Auth\RegisterVerifyController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\Auth\SignInMethodController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationPreferenceController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TuitionRequestController;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\TutoringSessionController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Departments
    |--------------------------------------------------------------------------
    */

    Route::get('/departments', [DepartmentController::class, 'index'])
        ->name('api.v1.departments.index');
    Route::get('/subjects', [SubjectController::class, 'index'])
        ->name('api.v1.subjects.index');

    /*
    |--------------------------------------------------------------------------
    | Conversations
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth.jwt')->prefix('conversations')->group(function () {

        Route::get('/', [ConversationController::class, 'index'])
            ->name('api.v1.conversations.index');

        Route::post('/', [ConversationController::class, 'store'])
            ->name('api.v1.conversations.store');

        // Everyone the user can see in the message list, locked or not.
        Route::get('/contacts', [ConversationController::class, 'contacts'])
            ->name('api.v1.conversations.contacts');

        Route::get('/unread-count', [ConversationController::class, 'unreadCount'])
            ->name('api.v1.conversations.unread-count');

        Route::get('/{conversation}/messages', [ConversationController::class, 'messages'])
            ->name('api.v1.conversations.messages.index');

        Route::post('/{conversation}/messages', [ConversationController::class, 'sendMessage'])
            ->middleware('throttle:60,1')
            ->name('api.v1.conversations.messages.store');

        Route::patch('/{conversation}/read', [ConversationController::class, 'markRead'])
            ->name('api.v1.conversations.read');
    });

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth.jwt')->prefix('notifications')->group(function () {

        Route::get('/', [NotificationController::class, 'index'])
            ->name('api.v1.notifications.index');

        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])
            ->name('api.v1.notifications.unread-count');

        Route::patch('/read-all', [NotificationController::class, 'markAllAsRead'])
            ->name('api.v1.notifications.read-all');

        // Which kinds of notification this account wants.
        Route::get('/preferences', [NotificationPreferenceController::class, 'show'])
            ->name('api.v1.notifications.preferences.show');

        Route::patch('/preferences', [NotificationPreferenceController::class, 'update'])
            ->name('api.v1.notifications.preferences.update');

        Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead'])
            ->name('api.v1.notifications.read');
    });

    /*
    |--------------------------------------------------------------------------
    | Tutor Listings
    |--------------------------------------------------------------------------
    | These routes are available to authenticated users.
    */

    Route::middleware('auth.jwt')->prefix('tutors')->group(function () {

        Route::get('/', [TutorController::class, 'index'])
            ->name('api.v1.tutors.index');

        Route::get('/filters', [TutorController::class, 'filters'])
            ->name('api.v1.tutors.filters');
    });

    /*
    |--------------------------------------------------------------------------
    | Tutor Account Creation
    |--------------------------------------------------------------------------
    | Any authenticated user can create a tutor account.
    */

    Route::middleware('auth.jwt')->prefix('tutor')->group(function () {

        Route::post('/account', [TutorController::class, 'create'])
            ->name('api.v1.tutor.account.create');

        Route::get('/status', [TutorController::class, 'status'])
            ->name('api.v1.tutor.status');
    });
    /*
    |--------------------------------------------------------------------------
    | Tuition Requests
    |--------------------------------------------------------------------------
    | Students send requests; tutors read and answer their own.
    */

    Route::middleware('auth.jwt')->prefix('tuition-requests')->group(function () {

        Route::get('/mine', [TuitionRequestController::class, 'mine'])
            ->name('api.v1.tuition-requests.mine');

        Route::post('/', [TuitionRequestController::class, 'store'])
            ->middleware('throttle:20,1')
            ->name('api.v1.tuition-requests.store');

        /*
         * End an active arrangement. Either side may do it — a student who has
         * stopped working with a tutor used to be stuck waiting for the tutor
         * to end it — so this is not behind the tutor middleware. The
         * controller refuses anyone who is not one of the two.
         */
        Route::delete('/{tuitionRequest}', [TuitionRequestController::class, 'end'])
            ->name('api.v1.tuition-requests.end');
    });

    Route::middleware(['auth.jwt', 'tutor'])->prefix('tuition-requests')->group(function () {

        Route::get('/', [TuitionRequestController::class, 'index'])
            ->name('api.v1.tuition-requests.index');

        Route::patch('/{tuitionRequest}', [TuitionRequestController::class, 'update'])
            ->name('api.v1.tuition-requests.update');
    });
    /*
    |--------------------------------------------------------------------------
    | Tutoring sessions
    |--------------------------------------------------------------------------
    |
    | A session belongs to the pair rather than to one role, so either side
    | proposes and whichever did not propose it answers. Nothing here sits
    | behind the tutor middleware.
    |
    */

    Route::middleware('auth.jwt')->prefix('sessions')->group(function () {

        Route::get('/', [TutoringSessionController::class, 'index'])
            ->name('api.v1.sessions.index');

        Route::post('/', [TutoringSessionController::class, 'store'])
            ->middleware('throttle:30,1')
            ->name('api.v1.sessions.store');

        Route::patch('/{tutoringSession}/confirm', [TutoringSessionController::class, 'confirm'])
            ->name('api.v1.sessions.confirm');

        Route::delete('/{tutoringSession}', [TutoringSessionController::class, 'cancel'])
            ->name('api.v1.sessions.cancel');
    });

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    | Students rate the tutors who taught them; anyone signed in can read a
    | tutor's ratings, since that is what they weigh up before asking.
    */

    Route::middleware('auth.jwt')->group(function () {

        Route::get('/users/{user}/profile', [UserProfileController::class, 'show'])
            ->name('api.v1.users.profile');

        Route::get('/users/{user}/student-reviews', [UserProfileController::class, 'studentReviews'])
            ->name('api.v1.users.student-reviews');

        Route::get('/tutors/{tutor}/reviews', [ReviewController::class, 'index'])
            ->name('api.v1.tutors.reviews.index');

        Route::get('/reviews/mine', [ReviewController::class, 'mine'])
            ->name('api.v1.reviews.mine');

        Route::post('/reviews', [ReviewController::class, 'store'])
            ->middleware('throttle:30,1')
            ->name('api.v1.reviews.store');

        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])
            ->name('api.v1.reviews.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Student Dashboard
    |--------------------------------------------------------------------------
    | Every account is a student, tutors included, so none of this is behind
    | the tutor middleware: a tutor reading it sees their own student side.
    */

    Route::middleware('auth.jwt')->prefix('student')->group(function () {

        Route::get('/dashboard', [StudentDashboardController::class, 'show'])
            ->name('api.v1.student.dashboard');

        Route::get('/requests', [StudentDashboardController::class, 'requests'])
            ->name('api.v1.student.requests');

        Route::get('/saved-tutors', [StudentDashboardController::class, 'savedTutors'])
            ->name('api.v1.student.saved-tutors.index');

        Route::post('/saved-tutors', [StudentDashboardController::class, 'save'])
            ->middleware('throttle:60,1')
            ->name('api.v1.student.saved-tutors.store');

        Route::delete('/saved-tutors/{tutor}', [StudentDashboardController::class, 'unsave'])
            ->name('api.v1.student.saved-tutors.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Tutor Dashboard / Tutor-Only Routes
    |--------------------------------------------------------------------------
    | Requires both authentication AND isTutor = true.
    */

    Route::middleware(['auth.jwt', 'tutor'])->prefix('tutor')->group(function () {

        Route::get('/dashboard', [TutorController::class, 'dashboard'])
            ->name('api.v1.tutor.dashboard');

        // Read and edit the public tutoring details.
        Route::get('/profile', [TutorController::class, 'showProfile'])
            ->name('api.v1.tutor.profile.show');

        Route::patch('/profile', [TutorController::class, 'updateProfile'])
            ->name('api.v1.tutor.profile.update');
    });

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::prefix('auth')->group(function () {

        Route::post('/register/info', [RegisterInfoController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('api.v1.auth.register.info');

        Route::post('/register/verify', [RegisterVerifyController::class, 'verify'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.register.verify');

        Route::post('/register/resend', [RegisterVerifyController::class, 'resend'])
            ->middleware('throttle:3,1')
            ->name('api.v1.auth.register.resend');

        Route::post('/register/security', [RegisterSecurityController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('api.v1.auth.register.security');

        Route::post('/login', [LoginController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('api.v1.auth.login');

        // Sign in with an AUST institutional Google account.
        Route::post('/google', [GoogleLoginController::class, 'store'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.google');

        Route::post('/refresh', [SessionController::class, 'refresh'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.refresh');

        Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('password.email');

        Route::post('/reset-password', [NewPasswordController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('password.store');

        /*
        |--------------------------------------------------------------------------
        | Current User
        |--------------------------------------------------------------------------
        */

        Route::middleware('auth.jwt')->group(function () {

            Route::get('/me', [SessionController::class, 'me'])
                ->name('api.v1.auth.me');

            Route::post('/logout', [SessionController::class, 'logout'])
                ->name('api.v1.auth.logout');

            // Supplies the details a Google sign-in cannot provide.
            Route::patch('/profile', [ProfileController::class, 'update'])
                ->name('api.v1.auth.profile.update');

            /*
             * Sign-in methods: whichever way the account was created, the
             * holder can add the other here.
             */
            Route::get('/sign-in-methods', [SignInMethodController::class, 'index'])
                ->name('api.v1.auth.sign-in-methods.index');

            Route::post('/password', [SignInMethodController::class, 'setPassword'])
                ->middleware('throttle:10,1')
                ->name('api.v1.auth.password.set');

            Route::post('/google/link', [SignInMethodController::class, 'linkGoogle'])
                ->middleware('throttle:10,1')
                ->name('api.v1.auth.google.link');

            Route::delete('/google/link', [SignInMethodController::class, 'unlinkGoogle'])
                ->name('api.v1.auth.google.unlink');

            // Close the account for good, after confirming it is really them.
            Route::delete('/account', [AccountController::class, 'destroy'])
                ->middleware('throttle:5,1')
                ->name('api.v1.auth.account.destroy');
        });
    });
});
