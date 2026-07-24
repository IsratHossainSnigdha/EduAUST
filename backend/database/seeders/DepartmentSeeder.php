<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Seed the university's academic departments.
     */
    public function run(): void
    {
        $departments = [
            ['code' => 'CSE', 'name' => 'Computer Science and Engineering'],
            ['code' => 'EEE', 'name' => 'Electrical and Electronic Engineering'],
            ['code' => 'CE', 'name' => 'Civil Engineering'],
            ['code' => 'ME', 'name' => 'Mechanical Engineering'],
            ['code' => 'IPE', 'name' => 'Industrial and Production Engineering'],
            ['code' => 'TE', 'name' => 'Textile Engineering'],
            ['code' => 'ARCH', 'name' => 'Architecture'],
            ['code' => 'BBA', 'name' => 'Business Administration'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                ['name' => $department['name']],
            );
        }
    }
}
