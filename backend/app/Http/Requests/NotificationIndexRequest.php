<?php

namespace App\Http\Requests;

use App\Models\Notification;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NotificationIndexRequest extends FormRequest
{
    /**
     * The most notifications a single request will return.
     */
    private const MAX_LIMIT = 100;

    private const DEFAULT_LIMIT = 50;

    /**
     * Determine if the user is authorized to make this request.
     *
     * The route is behind the JWT guard, and the query is always scoped to the
     * authenticated user.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'audience' => ['sometimes', 'string', Rule::in(Notification::SELECTABLE_AUDIENCES)],
            'category' => ['sometimes', 'string', Rule::in(Notification::CATEGORIES)],
            'unread' => ['sometimes', 'boolean'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_LIMIT],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category.in' => 'The selected category is invalid.',
            'audience.in' => 'The selected audience is invalid.',
        ];
    }

    /**
     * The dashboard being viewed, or null to list every notification.
     */
    public function audience(): ?string
    {
        return $this->filled('audience')
            ? $this->string('audience')->value()
            : null;
    }

    /**
     * The category to filter by, or null for all categories.
     */
    public function category(): ?string
    {
        return $this->filled('category')
            ? $this->string('category')->value()
            : null;
    }

    /**
     * Whether the caller asked for unread notifications only.
     */
    public function unreadOnly(): bool
    {
        return $this->boolean('unread');
    }

    /**
     * How many notifications to return, bounded so the list stays cheap.
     */
    public function limit(): int
    {
        return (int) $this->input('limit', self::DEFAULT_LIMIT);
    }
}
