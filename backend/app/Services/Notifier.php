<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\TuitionRequest;
use App\Models\TutoringSession;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Raises the in-app notifications the dashboards read.
 *
 * The notifications table existed and was displayed long before anything
 * wrote to it, so every event that matters to the other party is recorded
 * here in one place rather than scattered through the controllers.
 */
class Notifier
{
    /**
     * Tell a tutor that a student has asked them to teach.
     */
    public function tuitionRequested(TuitionRequest $request): void
    {
        $student = $request->student?->name ?? 'A student';
        $subject = $request->subject?->name;

        $this->to(
            $request->tutor_id,
            Notification::AUDIENCE_TUTOR,
            Notification::CATEGORY_REQUEST,
            'New tuition request',
            $subject
                ? "{$student} asked for help with {$subject}."
                : "{$student} sent you a tuition request.",
            '/tutor-requests',
        );
    }

    /**
     * Tell a student how their request was answered.
     */
    public function tuitionAnswered(TuitionRequest $request): void
    {
        $tutor = $request->tutor?->name ?? 'A tutor';
        $subject = $request->subject?->name;
        $about = $subject ? " for {$subject}" : '';

        $accepted = $request->status === TuitionRequest::STATUS_ACCEPTED;

        $this->to(
            $request->student_id,
            Notification::AUDIENCE_STUDENT,
            Notification::CATEGORY_REQUEST,
            $accepted ? 'Request accepted' : 'Request declined',
            $accepted
                // Acceptance is also what unlocks messaging, so say so.
                ? "{$tutor} accepted your request{$about}. You can message them now."
                : "{$tutor} declined your request{$about}.",
            // Acceptance opens the conversation, so take them to it; a
            // decline has nothing to open but the list it came from.
            $accepted ? '/messages?with='.$request->tutor_id : '/my-requests',
        );
    }

    /**
     * Tell a student their tutor has closed the arrangement.
     *
     * A relationship ending is not a silent state change: the student loses
     * the conversation with it, so they are told rather than left to discover
     * a chat that no longer works.
     */
    /**
     * Either side may end an arrangement, so the notice goes to whichever of
     * them did not, worded for them.
     */
    public function tuitionEnded(TuitionRequest $request, string $endedBy): void
    {
        $subject = $request->subject?->name;
        $about = $subject ? " for {$subject}" : '';

        if ($endedBy === $request->tutor_id) {
            $tutor = $request->tutor?->name ?? 'Your tutor';

            $this->to(
                $request->student_id,
                Notification::AUDIENCE_STUDENT,
                Notification::CATEGORY_REQUEST,
                'Tutoring ended',
                "{$tutor} has ended your tutoring{$about}. You can send a new request if you would like to continue.",
                '/my-tutors',
            );

            return;
        }

        $student = $request->student?->name ?? 'Your student';

        $this->to(
            $request->tutor_id,
            Notification::AUDIENCE_TUTOR,
            Notification::CATEGORY_REQUEST,
            'Tutoring ended',
            "{$student} has ended their tutoring with you{$about}.",
            '/my-students',
        );
    }

    /**
     * Tell someone they have a new message.
     */
    public function messageReceived(User $recipient, User $sender, string $body): void
    {
        if (! $recipient->wantsNotificationsAbout(Notification::CATEGORY_MESSAGE)) {
            return;
        }

        // Straight to that person's conversation, not just the message box.
        $link = '/messages?with='.$sender->id;

        /*
         * One notification per conversation, not per message. A burst of ten
         * messages used to leave ten rows; while the last one is still unread
         * it is brought up to date instead. The link names the sender by id,
         * so two people who share a name are never merged.
         */
        $existing = Notification::query()
            ->where('user_id', $recipient->id)
            ->where('category', Notification::CATEGORY_MESSAGE)
            ->where('link', $link)
            ->unread()
            ->latest()
            ->first();

        if ($existing) {
            $existing->forceFill([
                'body' => Str::limit($body, 120),
                // Moved to the top, as a new notification would be.
                'created_at' => now(),
            ])->save();

            return;
        }

        $this->to(
            $recipient->id,
            // A conversation is not tied to a role, so either dashboard shows it.
            Notification::AUDIENCE_BOTH,
            Notification::CATEGORY_MESSAGE,
            "New message from {$sender->name}",
            Str::limit($body, 120),
            $link,
        );
    }

    /**
     * Tell the other side that a time has been suggested.
     */
    public function sessionProposed(TutoringSession $session, string $proposedBy): void
    {
        $other = $session->counterpartFor($proposedBy);

        if (! $other) {
            return;
        }

        $who = ($proposedBy === $session->tutor_id ? $session->tutor : $session->student)?->name
            ?? 'Someone';

        $this->to(
            $other->id,
            Notification::AUDIENCE_BOTH,
            Notification::CATEGORY_SESSION,
            'New session proposed',
            "{$who} suggested a session on {$this->when($session)}. Confirm it if that works for you.",
            '/sessions',
        );
    }

    /**
     * Tell whoever proposed it that the other side agreed.
     */
    public function sessionConfirmed(TutoringSession $session, string $confirmedBy): void
    {
        $other = $session->counterpartFor($confirmedBy);

        if (! $other) {
            return;
        }

        $who = ($confirmedBy === $session->tutor_id ? $session->tutor : $session->student)?->name
            ?? 'They';

        $this->to(
            $other->id,
            Notification::AUDIENCE_BOTH,
            Notification::CATEGORY_SESSION,
            'Session confirmed',
            "{$who} confirmed your session on {$this->when($session)}.",
            '/sessions',
        );
    }

    /**
     * Tell the other side that a session is off.
     */
    public function sessionCancelled(TutoringSession $session, string $cancelledBy): void
    {
        $other = $session->counterpartFor($cancelledBy);

        if (! $other) {
            return;
        }

        $who = ($cancelledBy === $session->tutor_id ? $session->tutor : $session->student)?->name
            ?? 'Someone';

        $this->to(
            $other->id,
            Notification::AUDIENCE_BOTH,
            Notification::CATEGORY_SESSION,
            'Session cancelled',
            "{$who} cancelled the session on {$this->when($session)}.",
            '/sessions',
        );
    }

    /**
     * A session's time, written the way a person would say it.
     */
    private function when(TutoringSession $session): string
    {
        return $session->scheduled_at->format('D j M \a\t g:ia');
    }

    /**
     * Record one notification, unless the recipient has switched that kind
     * off in their settings.
     *
     * @param  string|null  $link  Where opening this notification should go.
     */
    private function to(
        string $userId,
        string $audience,
        string $category,
        string $title,
        string $body,
        ?string $link = null,
    ): void {
        $recipient = User::find($userId);

        if (! $recipient || ! $recipient->wantsNotificationsAbout($category)) {
            return;
        }

        Notification::create([
            'user_id' => $userId,
            'audience' => $audience,
            'category' => $category,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);
    }
}
