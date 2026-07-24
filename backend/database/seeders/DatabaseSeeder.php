<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with reference data only.
     *
     * The department list is real lookup data. We intentionally do NOT seed
     * a factory "test user" here — the factory generates a random department
     * (junk like "cum nihil voluptas") that would pollute the department
     * dropdown. Real users come from the registration flow; tests build their
     * own users via the factory.
     */
    public function run(): void
    {
        $this->call(DepartmentSeeder::class);
    }
}
