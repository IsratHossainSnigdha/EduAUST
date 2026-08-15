<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubjectSeeder extends Seeder
{
    /**
     * Seed the subjects tutors can be listed under.
     *
     * Like departments this is real lookup data: the Find Tutor subject filter
     * is populated from it.
     */
    public function run(): void
    {
        $subjects = [
            'Data Structures',
            'Algorithms',
            'C Programming',
            'Database Systems',
            'Web Development',
            'Operating Systems',
            'Discrete Mathematics',
            'Calculus',
            'Linear Algebra',
            'Physics',
            'Circuit Analysis',
            'Digital Logic Design',
            'Thermodynamics',
            'Engineering Drawing',
        ];

        foreach ($subjects as $name) {
            Subject::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            );
        }
    }
}
