<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    /**
     * The longest a single message may be.
     */
    private const MAX_LENGTH = 2000;

    /**
     * Determine if the user is authorized to make this request.
     *
     * Participation in the conversation is checked in the controller, where
     * the thread is resolved, so a non-participant cannot tell an existing
     * conversation apart from one that does not exist.
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
            // Whitespace-only messages are rejected by the trim in
            // prepareForValidation combined with `required`.
            'body' => ['required', 'string', 'max:'.self::MAX_LENGTH],
        ];
    }

    /**
     * Trim the body before validating so a message of only spaces is treated
     * as empty rather than stored blank.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('body') && is_string($this->input('body'))) {
            $this->merge(['body' => trim($this->input('body'))]);
        }
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'The message cannot be empty.',
        ];
    }

    /**
     * The message text.
     */
    public function body(): string
    {
        return $this->string('body')->value();
    }
}
