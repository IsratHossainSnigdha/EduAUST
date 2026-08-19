<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendMessageRequest;
use App\Http\Requests\StartConversationRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    /**
     * The number of messages returned per page of a thread.
     */
    private const MESSAGES_PER_PAGE = 50;

    /**
     * List the authenticated user's conversations, most recently active first.
     *
     * Each entry carries the other participant, a preview of the last message
     * and the number of messages still unread, which is everything the
     * conversation sidebar renders.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->forUser($user->id)
            ->with([
                'userOne:id,name,profile_picture,department_id',
                'userOne.department:id,name,code',
                'userTwo:id,name,profile_picture,department_id',
                'userTwo.department:id,name,code',
                'latestMessage',
            ])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query->unreadFor($user->id),
            ])
            // Threads that have never been used sort last rather than first.
            ->orderByRaw('last_message_at is null')
            ->orderByDesc('last_message_at')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $conversations->map(fn (Conversation $conversation) => $this->presentConversation($conversation, $user->id)),
            'unread_total' => $this->unreadTotalFor($user->id),
        ]);
    }

    /**
     * Open a conversation with another user, reusing the existing thread when
     * one is already present.
     */
    public function store(StartConversationRequest $request): JsonResponse
    {
        $user = $request->user();

        $conversation = Conversation::betweenIds($user->id, $request->counterpartId());
        $conversation->load(['userOne.department', 'userTwo.department', 'latestMessage']);

        // `firstOrCreate` means an existing thread is returned untouched, so
        // 200 and 201 distinguish "opened" from "created".
        $status = $conversation->wasRecentlyCreated ? 201 : 200;

        return response()->json([
            'data' => $this->presentConversation($conversation, $user->id),
        ], $status);
    }

    /**
     * Fetch a thread's messages, oldest first, and mark it as read.
     */
    public function messages(Request $request, string $conversation): JsonResponse
    {
        $user = $request->user();
        $thread = $this->participatingConversation($request, $conversation);

        // Opening a thread is what marks it read.
        Message::query()
            ->where('conversation_id', $thread->id)
            ->unreadFor($user->id)
            ->update(['read_at' => now()]);

        $messages = Message::query()
            ->where('conversation_id', $thread->id)
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->orderBy('id')
            ->paginate(self::MESSAGES_PER_PAGE);

        $thread->load(['userOne.department', 'userTwo.department']);

        return response()->json([
            'conversation' => $this->presentConversation($thread, $user->id, withUnread: false),
            'data' => collect($messages->items())->map(fn (Message $message) => $this->presentMessage($message, $user->id)),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Post a message to a thread.
     */
    public function sendMessage(SendMessageRequest $request, string $conversation): JsonResponse
    {
        $user = $request->user();
        $thread = $this->participatingConversation($request, $conversation);

        // The message and the thread's activity timestamp must move together,
        // otherwise a failure between them leaves the list mis-ordered.
        $message = DB::transaction(function () use ($thread, $user, $request) {
            $message = Message::create([
                'conversation_id' => $thread->id,
                'sender_id' => $user->id,
                'body' => $request->body(),
            ]);

            $thread->forceFill(['last_message_at' => $message->created_at])->save();

            return $message;
        });

        $message->load('sender:id,name');

        return response()->json([
            'message' => 'Message sent.',
            'data' => $this->presentMessage($message, $user->id),
        ], 201);
    }

    /**
     * Mark every message the user has received in a thread as read.
     */
    public function markRead(Request $request, string $conversation): JsonResponse
    {
        $user = $request->user();
        $thread = $this->participatingConversation($request, $conversation);

        $marked = Message::query()
            ->where('conversation_id', $thread->id)
            ->unreadFor($user->id)
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Conversation marked as read.',
            'marked_count' => $marked,
            'unread_total' => $this->unreadTotalFor($user->id),
        ]);
    }

    /**
     * The authenticated user's total unread messages, for the sidebar badge.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'unread_total' => $this->unreadTotalFor($request->user()->id),
        ]);
    }

    /**
     * Resolve a conversation the authenticated user actually belongs to.
     *
     * Someone else's thread is reported as missing rather than forbidden, so
     * conversation ids cannot be probed for existence.
     */
    private function participatingConversation(Request $request, string $conversationId): Conversation
    {
        return Conversation::query()
            ->forUser($request->user()->id)
            ->findOrFail($conversationId);
    }

    /**
     * The number of unread messages across all of a user's conversations.
     */
    private function unreadTotalFor(string $userId): int
    {
        return Message::query()
            ->unreadFor($userId)
            ->whereHas('conversation', fn ($query) => $query->forUser($userId))
            ->count();
    }

    /**
     * The API shape of a conversation row.
     *
     * @return array<string, mixed>
     */
    private function presentConversation(Conversation $conversation, string $userId, bool $withUnread = true): array
    {
        $other = $conversation->counterpartFor($userId);
        $latest = $conversation->latestMessage;

        $payload = [
            'id' => $conversation->id,
            'participant' => $other ? [
                'id' => $other->id,
                'name' => $other->name,
                'avatar' => $other->profile_picture,
                'department' => $other->department?->code,
            ] : null,
            'last_message' => $latest ? [
                'body' => $latest->body,
                'sent_by_me' => $latest->sender_id === $userId,
                'created_at' => $latest->created_at?->toIso8601String(),
                'time' => $latest->created_at?->diffForHumans(),
            ] : null,
            'last_message_at' => $conversation->last_message_at?->toIso8601String(),
        ];

        if ($withUnread) {
            $payload['unread_count'] = (int) ($conversation->unread_count ?? 0);
        }

        return $payload;
    }

    /**
     * The API shape of a single message.
     *
     * @return array<string, mixed>
     */
    private function presentMessage(Message $message, string $userId): array
    {
        return [
            'id' => $message->id,
            'body' => $message->body,
            // The client renders its own messages on the opposite side.
            'sent_by_me' => $message->sender_id === $userId,
            'sender_id' => $message->sender_id,
            'sender_name' => $message->sender?->name,
            'read' => $message->read_at !== null,
            'created_at' => $message->created_at?->toIso8601String(),
            'time' => $message->created_at?->format('g:i A'),
        ];
    }
}
