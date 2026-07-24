<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterSecurityRequest extends FormRequest
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
        return [
            'registration_token' => ['required', 'string'],

            // Must match `password_confirmation` and satisfy the strong
            // password policy: >= 8 chars with upper, lower, number, symbol.
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }
}
