<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\TuitionRequest;
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
            $accepted ? '/messages' : '/my-requests',
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
        $this->to(
            $recipient->id,
            // A conversation is not tied to a role, so either dashboard shows it.
            Notification::AUDIENCE_BOTH,
            Notification::CATEGORY_MESSAGE,
            "New message from {$sender->name}",
            Str::limit($body, 120),
            '/messages',
        );
    }

    /**
     * Record one notification.
     */
    /**
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
