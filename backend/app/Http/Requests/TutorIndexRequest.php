<?php

namespace App\Http\Requests;

use App\Models\TutorProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TutorIndexRequest extends FormRequest
{
    /**
     * The most tutors a single page will return.
     */
    private const MAX_PER_PAGE = 50;

    private const DEFAULT_PER_PAGE = 12;

    /**
     * Determine if the user is authorized to make this request.
     *
     * The route sits behind the JWT guard; any signed-in user may browse the
     * tutor listing.
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
            'search' => ['sometimes', 'string', 'max:100'],
            'subject_id' => ['sometimes', 'integer', Rule::exists('subjects', 'id')],
            'department_id' => ['sometimes', 'integer', Rule::exists('departments', 'id')],
            'language' => ['sometimes', 'string', 'max:50'],
            'min_experience' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'min_students' => ['sometimes', 'integer', 'min:0'],
            'sort' => ['sometimes', 'string', Rule::in(TutorProfile::SORTS)],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'page' => ['sometimes', 'integer', 'min:1'],
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
            'sort.in' => 'The selected sort order is invalid.',
            'subject_id.exists' => 'The selected subject is invalid.',
            'department_id.exists' => 'The selected department is invalid.',
        ];
    }

    /**
     * The free-text search term, or null when none was given.
     */
    public function search(): ?string
    {
        $term = trim((string) $this->input('search', ''));

        return $term === '' ? null : $term;
    }

    public function subjectId(): ?int
    {
        return $this->filled('subject_id') ? (int) $this->input('subject_id') : null;
    }

    public function departmentId(): ?int
    {
        return $this->filled('department_id') ? (int) $this->input('department_id') : null;
    }

    public function language(): ?string
    {
        return $this->filled('language') ? trim($this->string('language')->value()) : null;
    }

    public function minExperience(): ?int
    {
        return $this->filled('min_experience') ? (int) $this->input('min_experience') : null;
    }

    public function minStudents(): ?int
    {
        return $this->filled('min_students') ? (int) $this->input('min_students') : null;
    }

    /**
     * The requested sort order, falling back to the listing default.
     */
    public function sort(): string
    {
        return $this->filled('sort')
            ? $this->string('sort')->value()
            : TutorProfile::DEFAULT_SORT;
    }

    /**
     * How many tutors to return per page.
     */
    public function perPage(): int
    {
        return (int) $this->input('per_page', self::DEFAULT_PER_PAGE);
    }
}
