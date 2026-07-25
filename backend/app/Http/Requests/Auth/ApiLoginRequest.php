<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApiLoginRequest extends FormRequest
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
     * Login accepts `aust_email` (the AUST institutional email), or the
     * legacy `identifier` field which additionally allows the student ID.
     * "Remember me" may be sent as `remember_me` or `remember`.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'aust_email' => ['required_without:identifier', 'string', 'email'],
            'identifier' => ['required_without:aust_email', 'string'],
            'password' => ['required', 'string'],
            'remember_me' => ['sometimes', 'boolean'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * The credential the user is logging in with (email or student ID).
     */
    public function credential(): string
    {
        return $this->string('aust_email')->trim()->value()
            ?: $this->string('identifier')->trim()->value();
    }

    /**
     * Whether the user asked to be remembered (longer-lived refresh token).
     */
    public function wantsRemember(): bool
    {
        return $this->boolean('remember_me') || $this->boolean('remember');
    }

    /**
     * The request field the generic credentials error should be keyed under.
     */
    public function credentialField(): string
    {
        return $this->filled('aust_email') ? 'aust_email' : 'identifier';
    }
}
