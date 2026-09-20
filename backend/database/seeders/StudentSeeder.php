<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentSeeder extends Seeder
{
    /**
     * Create fake student accounts for development.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Get existing departments
        |--------------------------------------------------------------------------
        */

        $departments = DB::table('departments')
            ->pluck('id')
            ->toArray();

        /*
        |--------------------------------------------------------------------------
        | Make sure departments exist
        |--------------------------------------------------------------------------
        */

        if (empty($departments)) {
            $this->command->error(
                'No departments found. Please seed departments first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Number of students
        |--------------------------------------------------------------------------
        */

        $numberOfStudents = 100;

        /*
        |--------------------------------------------------------------------------
        | Create students
        |--------------------------------------------------------------------------
        */

        for ($i = 0; $i < $numberOfStudents; $i++) {

            User::create([
                /*
                |--------------------------------------------------------------------------
                | Basic information
                |--------------------------------------------------------------------------
                */

                'name' => fake()->name(),

                /*
                | Generate a unique AUST-style student ID.
                */
                'student_id' => $this->generateStudentId(),

                /*
                | Fake AUST institutional email.
                */
                'email' => 'student' . uniqid() . '@aust.edu',

                /*
                | Random Bangladeshi phone number.
                */
                'phone' => '01' . fake()->randomElement([
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                    '9',
                ]) . fake()->numerify('########'),

                /*
                |--------------------------------------------------------------------------
                | Academic information
                |--------------------------------------------------------------------------
                */

                'department_id' => fake()->randomElement(
                    $departments
                ),

                'semester' => fake()->randomElement([
                    '1.1',
                    '1.2',
                    '2.1',
                    '2.2',
                    '3.1',
                    '3.2',
                    '4.1',
                    '4.2',
                    '5.1',
                    '5.2',
                ]),

                /*
                |--------------------------------------------------------------------------
                | Profile
                |--------------------------------------------------------------------------
                */

                'profile_picture' => null,

                /*
                |--------------------------------------------------------------------------
                | Authentication
                |--------------------------------------------------------------------------
                */

                'password' => 'Password@123',

                /*
                | IMPORTANT:
                | These users are students, NOT tutors.
                */
                'isTutor' => false,

                /*
                | Mark fake accounts as verified.
                */
                'email_verified_at' => now(),
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Success message
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            "{$numberOfStudents} fake student accounts created successfully."
        );
    }

    /**
     * Generate a unique fake AUST student ID.
     */
    private function generateStudentId(): string
    {
        do {
            /*
            | Example:
            | 230204001
            */
            $studentId = fake()->numerify(
                '#########'
            );

        } while (
            User::where(
                'student_id',
                $studentId
            )->exists()
        );

        return $studentId;
    }
}