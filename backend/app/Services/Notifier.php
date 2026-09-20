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
                : "{$student} sent you a tuition request."
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
                : "{$tutor} declined your request{$about}."
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
            Str::limit($body, 120)
        );
    }

    /**
     * Record one notification.
     */
    private function to(string $userId, string $audience, string $category, string $title, string $body): void
    {
        Notification::create([
            'user_id' => $userId,
            'audience' => $audience,
            'category' => $category,
            'title' => $title,
            'body' => $body,
        ]);
    }
}
