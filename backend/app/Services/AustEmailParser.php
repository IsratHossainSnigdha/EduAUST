<?php

namespace App\Services;

use App\Models\Department;

/**
 * Reads the identity encoded in an AUST institutional address.
 *
 * Student mailboxes follow the pattern name.dept.id@aust.edu — for example
 * shaikh.cse.20230204005@aust.edu — so the student ID and department can be
 * recovered from the address itself rather than asked for again.
 */
class AustEmailParser
{
    /**
     * Whether the address belongs to the configured institutional domain.
     */
    public function isInstitutional(string $email): bool
    {
        $domain = (string) config('services.aust.email_domain');

        return str_ends_with(strtolower(trim($email)), '@'.strtolower($domain));
    }

    /**
     * Extract the student ID and department code from an AUST address.
     *
     * The name may itself contain dots (md.shaikh.cse.20230204005@aust.edu),
     * so the identifiers are read from the end: the last segment is the
     * numeric student ID and the one before it is the department code.
     *
     * @return array{student_id: ?string, department_code: ?string}
     */
    public function parse(string $email): array
    {
        $localPart = strtolower(trim(explode('@', $email)[0] ?? ''));
        $segments = array_values(array_filter(explode('.', $localPart), 'strlen'));

        $studentId = null;
        $departmentCode = null;

        if (count($segments) >= 2) {
            $last = end($segments);

            if (ctype_digit($last)) {
                $studentId = $last;
                $departmentCode = prev($segments) ?: null;
            }
        }

        return [
            'student_id' => $studentId,
            'department_code' => $departmentCode,
        ];
    }

    /**
     * Resolve the department the address belongs to, if its code is one the
     * university actually has on record.
     */
    public function department(string $email): ?Department
    {
        $code = $this->parse($email)['department_code'];

        if (! $code) {
            return null;
        }

        return Department::whereRaw('LOWER(code) = ?', [$code])->first();
    }
}
