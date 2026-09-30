<?php

namespace Database\Seeders;

use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as FakerFactory;

class TutorSeeder extends Seeder
{
    /**
     * Create fake tutor profiles for development.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Create Faker instance
        |--------------------------------------------------------------------------
        */

        $faker = FakerFactory::create();

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
        | Get existing subjects
        |--------------------------------------------------------------------------
        */

        $subjects = DB::table('subjects')
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
        | Make sure subjects exist
        |--------------------------------------------------------------------------
        */

        if (empty($subjects)) {
            $this->command->error(
                'No subjects found. Please seed subjects first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Number of tutors
        |--------------------------------------------------------------------------
        */

        $numberOfTutors = 50;

        /*
        |--------------------------------------------------------------------------
        | Create tutors
        |--------------------------------------------------------------------------
        */

        for ($i = 0; $i < $numberOfTutors; $i++) {

            /*
            |--------------------------------------------------------------------------
            | Create User
            |--------------------------------------------------------------------------
            */

            $user = User::create([
                'name' => $faker->name(),

                /*
                | Random unique AUST-style student ID.
                */
                'student_id' => $this->generateStudentId($faker),

                /*
                | Fake AUST email.
                */
                'email' => 'tutor' . uniqid() . '@aust.edu',

                /*
                | Random Bangladeshi phone number.
                */
                'phone' => '01' . $faker->randomElement([
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                    '9',
                ]) . $faker->numerify('########'),

                /*
                | Existing department.
                */
                'department_id' => $faker->randomElement(
                    $departments
                ),

                /*
                | Existing semester values.
                */
                'semester' => $faker->randomElement([
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
                | No image for now.
                */
                'profile_picture' => null,

                /*
                | The User model hashes this automatically
                | because password has the "hashed" cast.
                */
                'password' => 'Password@123',

                /*
                | Mark the user as a tutor.
                */
                'isTutor' => true,

                /*
                | Verified so the tutor appears in listable queries.
                */
                'email_verified_at' => now(),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Create Tutor Profile
            |--------------------------------------------------------------------------
            */

            $profile = TutorProfile::create([
                'user_id' => $user->id,

                /*
                | Short title displayed on tutor cards.
                */
                'headline' => $faker->randomElement([
                    'Experienced CSE Tutor',
                    'Programming & Algorithm Tutor',
                    'Mathematics Tutor',
                    'Physics Tutor',
                    'Database & SQL Tutor',
                    'Web Development Tutor',
                    'Competitive Programming Tutor',
                    'Programming Fundamentals Tutor',
                    'Software Engineering Tutor',
                    'Data Structures Tutor',
                ]),

                /*
                | Tutor introduction.
                */
                'bio' => $faker->paragraph(
                    $faker->numberBetween(2, 4)
                ),

                /*
                | Random hourly rate in BDT.
                */
                'hourly_rate' => $faker->randomElement([
                    300,
                    350,
                    400,
                    450,
                    500,
                    550,
                    600,
                    650,
                    700,
                    800,
                ]),

                /*
                | Teaching experience.
                */
                'experience_years' => $faker->numberBetween(
                    1,
                    8
                ),

                /*
                | Number of students taught.
                */
                'student_count' => $faker->numberBetween(
                    0,
                    50
                ),

                /*
                | Languages spoken.
                */
                'languages' => $faker->randomElements(
                    [
                        'Bangla',
                        'English',
                        'Hindi',
                    ],
                    $faker->numberBetween(1, 3)
                ),

                /*
                | Most tutors are available.
                */
                'is_available' => $faker->boolean(80),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Attach Random Subjects
            |--------------------------------------------------------------------------
            */

            $numberOfSubjects = min(
                $faker->numberBetween(1, 4),
                count($subjects)
            );

            $randomSubjects = collect($subjects)
                ->shuffle()
                ->take($numberOfSubjects)
                ->values()
                ->toArray();

            $profile->subjects()->sync(
                $randomSubjects
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Success message
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            "{$numberOfTutors} fake tutor profiles created successfully."
        );
    }

    /**
     * Generate a unique fake student ID.
     */
    private function generateStudentId($faker): string
    {
        do {
            /*
            | Example:
            | 230204001
            */
            $studentId = $faker->numerify(
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

