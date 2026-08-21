<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * Demo Student
         */
        User::updateOrCreate(
            [
                'student_id' => 'DEMO001',
            ],
            [
                'name' => 'Demo Student',
                'email' => 'demo.student@aust.edu',
                'phone' => '01700000000',
                'department_id' => 1,
                'semester' => 8,
                'profile_picture' => null,
                'password' => 'DemoPassword123',
                'isTutor' => false,
                'email_verified_at' => now(),
            ]
        );

        /*
         * Demo Tutor
         */
        User::updateOrCreate(
            [
                'student_id' => 'DEMO002',
            ],
            [
                'name' => 'Demo Tutor',
                'email' => 'demo.tutor@aust.edu',
                'phone' => '01700000001',
                'department_id' => 1,
                'semester' => 8,
                'profile_picture' => null,
                'password' => 'DemoPassword123',
                'isTutor' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}