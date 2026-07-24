<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    /**
     * List the university's departments for selection during registration.
     */
    public function index(): JsonResponse
    {
        $departments = Department::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return response()->json(['data' => $departments]);
    }
}
