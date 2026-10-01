<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Which kinds of notification the signed-in account wants.
 *
 * The switches on the settings screen used to change nothing but the page's
 * own state. They are stored here, and the Notifier reads them before it
 * records anything.
 */
class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'preferences' => $request->user()->notificationPreferences(),
        ]);
    }

    /**
     * Change any number of topics at once; topics not named keep their value.
     */
    public function update(Request $request): JsonResponse
    {
        $rules = [];

        foreach (array_keys(User::NOTIFICATION_TOPICS) as $topic) {
            $rules[$topic] = ['sometimes', 'boolean'];
        }

        $validated = $request->validate($rules);
        $user = $request->user();

        $preferences = array_merge($user->notificationPreferences(), array_map('boolval', $validated));

        // Only what is switched off needs keeping; everything else is the
        // default, including topics added later.
        $user->forceFill([
            'notification_preferences' => array_filter($preferences, fn (bool $on) => ! $on) ?: null,
        ])->save();

        return response()->json([
            'message' => 'Your notification preferences have been saved.',
            'preferences' => $user->notificationPreferences(),
        ]);
    }
}
