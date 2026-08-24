<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Every field is optional so the form can submit only what is still
     * missing, but the uniqueness rules always ignore the caller's own row.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'student_id' => [
                'sometimes',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique(User::class, 'student_id')->ignore($userId),
            ],
            'phone' => [
                'sometimes',
                'string',
                'regex:/^\+?[0-9]{7,15}$/',
                Rule::unique(User::class, 'phone')->ignore($userId),
            ],
            'department_id' => ['sometimes', 'integer', Rule::exists('departments', 'id')],
            'semester' => ['sometimes', 'string', 'max:10'],
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
            'phone.regex' => 'The phone number must contain only digits and an optional leading +.',
            'student_id.regex' => 'The student ID may only contain letters, numbers, and hyphens.',
            'department_id.exists' => 'The selected department is invalid.',
        ];
    }
}
