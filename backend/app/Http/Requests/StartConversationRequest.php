<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartConversationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * The route is behind the JWT guard; any signed-in user may open a thread
     * with another user.
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
            'user_id' => [
                'required',
                'string',
                Rule::exists(User::class, 'id'),
                // A conversation needs two people.
                Rule::notIn([$this->user()?->id]),
            ],
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
            'user_id.exists' => 'The selected user does not exist.',
            'user_id.not_in' => 'You cannot start a conversation with yourself.',
        ];
    }

    /**
     * The user to open a conversation with.
     */
    public function counterpartId(): string
    {
        return $this->string('user_id')->value();
    }
}
