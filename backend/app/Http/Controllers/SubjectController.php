<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\JsonResponse;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        $subjects = Subject::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        return response()->json([
            'subjects' => $subjects,
        ]);
    }
}