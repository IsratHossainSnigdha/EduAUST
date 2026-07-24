<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterInfoRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $domain = config('services.aust.email_domain');

        return [
            'name' => ['required', 'string', 'max:255'],

            'student_id' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique(User::class, 'student_id'),
            ],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email:rfc',
                'max:255',
                // Must be an AUST institutional address, e.g. name@aust.edu
                'regex:/@'.preg_quote($domain, '/').'$/i',
                Rule::unique(User::class, 'email'),
            ],

            'phone' => [
                'required',
                'string',
                'regex:/^\+?[0-9]{7,15}$/',
                Rule::unique(User::class, 'phone'),
            ],

            // The selected department must exist in the university database.
            'department_id' => [
                'required',
                'integer',
                Rule::exists('departments', 'id'),
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
        $domain = config('services.aust.email_domain');

        return [
            'email.regex' => "The email must be a valid AUST institutional address (@{$domain}).",
            'phone.regex' => 'The phone number must contain only digits and an optional leading +.',
            'student_id.regex' => 'The student ID may only contain letters, numbers, and hyphens.',
            'department_id.exists' => 'The selected department is invalid.',
        ];
    }
}
