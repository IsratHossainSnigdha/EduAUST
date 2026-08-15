<?php

namespace App\Http\Controllers;

use App\Http\Requests\NotificationIndexRequest;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    /**
     * List the authenticated user's notifications, grouped by recency.
     *
     * `audience` selects the dashboard being viewed (student or tutor) and
     * always includes notifications addressed to both; omitting it lists
     * everything. `category` and `unread` narrow the list further, while
     * `unread_count` stays scoped to the dashboard so the badge is not thrown
     * off by whichever tab happens to be active.
     */
    public function index(NotificationIndexRequest $request): JsonResponse
    {
        $user = $request->user();
        $audience = $request->audience();

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->latest();

        if ($audience) {
            $query->forAudience($audience);
        }

        if ($category = $request->category()) {
            $query->category($category);
        }

        if ($request->unreadOnly()) {
            $query->unread();
        }

        $notifications = $query->limit($request->limit())->get();

        return response()->json([
            'audience' => $audience,
            'unread_count' => $this->unreadCountFor($user->id, $audience),
            'groups' => $this->groupByRecency($notifications),
        ]);
    }

    /**
     * The authenticated user's unread count, for the sidebar badge.
     *
     * `by_audience` gives each dashboard's own count so the role switcher can
     * show both at once. The two overlap by design: a notification addressed
     * to both dashboards counts towards each.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $audience = $this->requestedAudience($request);

        return response()->json([
            'unread_count' => $this->unreadCountFor($user->id, $audience),
            'by_audience' => [
                Notification::AUDIENCE_STUDENT => $this->unreadCountFor($user->id, Notification::AUDIENCE_STUDENT),
                Notification::AUDIENCE_TUTOR => $this->unreadCountFor($user->id, Notification::AUDIENCE_TUTOR),
            ],
        ]);
    }

    /**
     * Mark a single notification as read.
     *
     * The lookup is scoped to the authenticated user, so another user's
     * notification is indistinguishable from one that does not exist.
     */
    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $user = $request->user();

        $model = Notification::query()
            ->where('user_id', $user->id)
            ->findOrFail($notification);

        $model->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $this->present($model),
            'unread_count' => $this->unreadCountFor($user->id),
        ]);
    }

    /**
     * Mark unread notifications as read.
     *
     * Scoped to one dashboard when `audience` is given, so clearing the
     * student list does not silently clear the tutor one.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $audience = $this->requestedAudience($request);

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->unread();

        if ($audience) {
            $query->forAudience($audience);
        }

        $marked = $query->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'audience' => $audience,
            'marked_count' => $marked,
            'unread_count' => $this->unreadCountFor($user->id, $audience),
        ]);
    }

    /**
     * The dashboard the client is asking about, or null for all of them.
     */
    private function requestedAudience(Request $request): ?string
    {
        $validated = $request->validate([
            'audience' => ['sometimes', 'string', Rule::in(Notification::SELECTABLE_AUDIENCES)],
        ]);

        return $validated['audience'] ?? null;
    }

    /**
     * The number of unread notifications belonging to a user, optionally
     * limited to a single dashboard.
     */
    private function unreadCountFor(string $userId, ?string $audience = null): int
    {
        $query = Notification::query()
            ->where('user_id', $userId)
            ->unread();

        if ($audience) {
            $query->forAudience($audience);
        }

        return $query->count();
    }

    /**
     * Bucket notifications into Today / Yesterday / This Week / Earlier.
     *
     * Groups are returned newest-first and empty buckets are omitted, so the
     * client can render whatever it receives without filtering.
     *
     * @param  Collection<int, Notification>  $notifications
     * @return array<int, array<string, mixed>>
     */
    private function groupByRecency(Collection $notifications): array
    {
        $today = Carbon::today();
        $yesterday = $today->copy()->subDay();
        $weekStart = Carbon::now()->startOfWeek();

        $buckets = [
            'today' => ['label' => 'Today', 'notifications' => []],
            'yesterday' => ['label' => 'Yesterday', 'notifications' => []],
            'this_week' => ['label' => 'This Week', 'notifications' => []],
            'earlier' => ['label' => 'Earlier', 'notifications' => []],
        ];

        foreach ($notifications as $notification) {
            $createdAt = $notification->created_at;

            $key = match (true) {
                $createdAt >= $today => 'today',
                $createdAt >= $yesterday => 'yesterday',
                $createdAt >= $weekStart => 'this_week',
                default => 'earlier',
            };

            $buckets[$key]['notifications'][] = $this->present($notification);
        }

        $groups = [];

        foreach ($buckets as $key => $bucket) {
            if ($bucket['notifications'] !== []) {
                $groups[] = [
                    'key' => $key,
                    'label' => $bucket['label'],
                    'notifications' => $bucket['notifications'],
                ];
            }
        }

        return $groups;
    }

    /**
     * The API shape of a single notification.
     *
     * @return array<string, mixed>
     */
    private function present(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'audience' => $notification->audience,
            'category' => $notification->category,
            'title' => $notification->title,
            'body' => $notification->body,
            'unread' => $notification->isUnread(),
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
            // Pre-formatted for the list UI, e.g. "1 hour ago".
            'time' => $notification->created_at?->diffForHumans(),
        ];
    }
}
