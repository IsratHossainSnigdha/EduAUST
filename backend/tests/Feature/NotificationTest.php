<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(?User $user = null): User
    {
        $user = $user ?: User::factory()->create();

        $this->withToken(app(JwtService::class)->tokensFor($user)['access_token']);

        return $user;
    }

    /**
     * Pull every notification out of the grouped payload, ignoring buckets.
     *
     * @return array<int, array<string, mixed>>
     */
    private function flatten(array $groups): array
    {
        return array_merge(...array_map(
            fn (array $group) => $group['notifications'],
            $groups
        )) ?: [];
    }

    public function test_notifications_require_authentication(): void
    {
        $this->getJson('/api/v1/notifications')->assertUnauthorized();
        $this->getJson('/api/v1/notifications/unread-count')->assertUnauthorized();
        $this->patchJson('/api/v1/notifications/read-all')->assertUnauthorized();
        $this->patchJson('/api/v1/notifications/some-id/read')->assertUnauthorized();
    }

    public function test_index_returns_only_the_authenticated_users_notifications(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->create(['title' => 'Mine']);
        Notification::factory()->create(['title' => 'Someone elses']);

        $response = $this->getJson('/api/v1/notifications')->assertOk();

        $titles = array_column($this->flatten($response->json('groups')), 'title');

        $this->assertSame(['Mine'], $titles);
    }

    public function test_notifications_are_grouped_by_recency(): void
    {
        // Anchor mid-week so "yesterday" and "this week" cannot collide with
        // the start of the week.
        Carbon::setTestNow(Carbon::parse('2026-08-13 12:00:00'));

        $user = $this->actingAsUser();

        Notification::factory()->for($user)->createdAt(Carbon::now()->subHour())->create(['title' => 'today']);
        Notification::factory()->for($user)->createdAt(Carbon::yesterday()->addHours(3))->create(['title' => 'yesterday']);
        Notification::factory()->for($user)->createdAt(Carbon::now()->startOfWeek()->addHour())->create(['title' => 'this week']);
        Notification::factory()->for($user)->createdAt(Carbon::now()->subMonth())->create(['title' => 'earlier']);

        $groups = $this->getJson('/api/v1/notifications')->assertOk()->json('groups');

        $this->assertSame(
            ['Today', 'Yesterday', 'This Week', 'Earlier'],
            array_column($groups, 'label')
        );

        foreach ($groups as $group) {
            $this->assertCount(1, $group['notifications']);
        }

        $this->assertSame('today', $groups[0]['notifications'][0]['title']);
        $this->assertSame('earlier', $groups[3]['notifications'][0]['title']);

        Carbon::setTestNow();
    }

    public function test_empty_groups_are_omitted(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->create();

        $groups = $this->getJson('/api/v1/notifications')->assertOk()->json('groups');

        $this->assertCount(1, $groups);
        $this->assertSame('Today', $groups[0]['label']);
    }

    public function test_index_reports_the_unread_count(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->count(2)->create();
        Notification::factory()->for($user)->read()->create();
        Notification::factory()->create();

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 2);
    }

    public function test_unread_count_endpoint_returns_the_count(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->count(3)->create();
        Notification::factory()->for($user)->read()->create();

        $this->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_count', 3);
    }

    public function test_notifications_can_be_filtered_by_category(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->category(Notification::CATEGORY_MESSAGE)->create(['title' => 'msg']);
        Notification::factory()->for($user)->category(Notification::CATEGORY_SYSTEM)->create(['title' => 'sys']);

        $response = $this->getJson('/api/v1/notifications?category=message')->assertOk();

        $this->assertSame(['msg'], array_column($this->flatten($response->json('groups')), 'title'));
    }

    public function test_an_unknown_category_is_rejected(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/v1/notifications?category=bogus')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category');
    }

    public function test_notifications_can_be_filtered_to_unread_only(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->create(['title' => 'unread one']);
        Notification::factory()->for($user)->read()->create(['title' => 'already read']);

        $response = $this->getJson('/api/v1/notifications?unread=1')->assertOk();

        $titles = array_column($this->flatten($response->json('groups')), 'title');

        $this->assertSame(['unread one'], $titles);
        // The badge still reflects the whole account, not the filtered list.
        $response->assertJsonPath('unread_count', 1);
    }

    public function test_each_dashboard_sees_its_own_notifications_plus_shared_ones(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->student()->create(['title' => 'student only']);
        Notification::factory()->for($user)->tutor()->create(['title' => 'tutor only']);
        Notification::factory()->for($user)->create(['title' => 'shared']);

        $student = $this->getJson('/api/v1/notifications?audience=student')->assertOk();
        $tutor = $this->getJson('/api/v1/notifications?audience=tutor')->assertOk();

        $studentTitles = array_column($this->flatten($student->json('groups')), 'title');
        $tutorTitles = array_column($this->flatten($tutor->json('groups')), 'title');

        sort($studentTitles);
        sort($tutorTitles);

        $this->assertSame(['shared', 'student only'], $studentTitles);
        $this->assertSame(['shared', 'tutor only'], $tutorTitles);
    }

    public function test_omitting_the_audience_lists_every_dashboard(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->student()->create();
        Notification::factory()->for($user)->tutor()->create();
        Notification::factory()->for($user)->create();

        $response = $this->getJson('/api/v1/notifications')->assertOk();

        $this->assertCount(3, $this->flatten($response->json('groups')));
        $this->assertNull($response->json('audience'));
    }

    public function test_unread_count_is_scoped_to_the_requested_dashboard(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->student()->count(2)->create();
        Notification::factory()->for($user)->tutor()->create();
        Notification::factory()->for($user)->create();

        // Student sees its own two plus the shared one.
        $this->getJson('/api/v1/notifications?audience=student')
            ->assertOk()
            ->assertJsonPath('unread_count', 3);

        $this->getJson('/api/v1/notifications?audience=tutor')
            ->assertOk()
            ->assertJsonPath('unread_count', 2);
    }

    public function test_unread_count_endpoint_breaks_down_by_dashboard(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->student()->count(2)->create();
        Notification::factory()->for($user)->tutor()->create();
        Notification::factory()->for($user)->create();

        $this->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_count', 4)
            ->assertJsonPath('by_audience.student', 3)
            ->assertJsonPath('by_audience.tutor', 2);
    }

    public function test_an_unknown_audience_is_rejected(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/v1/notifications?audience=admin')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('audience');

        // 'both' is a storage value, not a dashboard a client can select.
        $this->getJson('/api/v1/notifications?audience=both')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('audience');
    }

    public function test_marking_all_read_on_one_dashboard_leaves_the_other_alone(): void
    {
        $user = $this->actingAsUser();
        $student = Notification::factory()->for($user)->student()->create();
        $tutor = Notification::factory()->for($user)->tutor()->create();
        $shared = Notification::factory()->for($user)->create();

        $this->patchJson('/api/v1/notifications/read-all?audience=student')
            ->assertOk()
            // The student's own notification and the shared one.
            ->assertJsonPath('marked_count', 2)
            ->assertJsonPath('unread_count', 0);

        $this->assertNotNull($student->fresh()->read_at);
        $this->assertNotNull($shared->fresh()->read_at);
        $this->assertNull($tutor->fresh()->read_at, 'The tutor dashboard should be untouched.');

        // The tutor dashboard still has its own unread notification.
        $this->getJson('/api/v1/notifications?audience=tutor')
            ->assertOk()
            ->assertJsonPath('unread_count', 1);
    }

    public function test_a_single_notification_can_be_marked_as_read(): void
    {
        $user = $this->actingAsUser();
        $notification = Notification::factory()->for($user)->create();
        Notification::factory()->for($user)->create();

        $this->patchJson("/api/v1/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('notification.unread', false)
            ->assertJsonPath('unread_count', 1);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_marking_an_already_read_notification_keeps_the_original_time(): void
    {
        $user = $this->actingAsUser();
        $readAt = Carbon::parse('2026-08-01 09:00:00');
        $notification = Notification::factory()->for($user)->create(['read_at' => $readAt]);

        $this->patchJson("/api/v1/notifications/{$notification->id}/read")->assertOk();

        $this->assertTrue($readAt->equalTo($notification->fresh()->read_at));
    }

    public function test_another_users_notification_cannot_be_marked_as_read(): void
    {
        $this->actingAsUser();
        $foreign = Notification::factory()->create();

        // Indistinguishable from a notification that does not exist.
        $this->patchJson("/api/v1/notifications/{$foreign->id}/read")->assertNotFound();

        $this->assertNull($foreign->fresh()->read_at);
    }

    public function test_all_notifications_can_be_marked_as_read(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->count(3)->create();
        Notification::factory()->for($user)->read()->create();
        $foreign = Notification::factory()->create();

        $this->patchJson('/api/v1/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('marked_count', 3)
            ->assertJsonPath('unread_count', 0);

        $this->assertSame(0, Notification::where('user_id', $user->id)->whereNull('read_at')->count());
        // Another user's notifications are untouched.
        $this->assertNull($foreign->fresh()->read_at);
    }

    public function test_the_list_is_bounded_by_the_limit(): void
    {
        $user = $this->actingAsUser();
        Notification::factory()->for($user)->count(5)->create();

        $response = $this->getJson('/api/v1/notifications?limit=2')->assertOk();

        $this->assertCount(2, $this->flatten($response->json('groups')));
    }

    public function test_an_out_of_range_limit_is_rejected(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/v1/notifications?limit=500')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('limit');
    }

    public function test_notifications_are_deleted_with_their_user(): void
    {
        $user = User::factory()->create();
        Notification::factory()->for($user)->count(2)->create();

        $user->delete();

        $this->assertSame(0, Notification::where('user_id', $user->id)->count());
    }
}
