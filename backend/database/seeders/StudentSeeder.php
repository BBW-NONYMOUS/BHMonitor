<?php

namespace Database\Seeders;

use App\Models\BoardingHouse;
use App\Models\Room;
use App\Models\Student;
use App\Models\StudentBoardingHistory;
use App\Models\StudentWarning;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $boardingHouse = BoardingHouse::where('boarding_name', 'Sunrise BH')->first();

        if (!$boardingHouse) {
            $this->command?->warn('StudentSeeder skipped: Sunrise BH was not found.');
            return;
        }

        $rooms = Room::where('boarding_house_id', $boardingHouse->id)
            ->get()
            ->keyBy('room_name');

        $students = [
            [
                'email' => 'student.approved@sksu.edu.ph',
                'password' => 'Student@1234',
                'account_status' => 'approved',
                'student_no' => '2026-0001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'gender' => 'Male',
                'course' => 'BSIT',
                'year_level' => '2nd Year',
                'contact_number' => '09170000001',
                'address' => 'Purok 1, Kalawag, Isulan',
                'parent_name' => 'Pedro Dela Cruz',
                'parent_contact' => '09179990001',
                'boarding_approval_status' => 'approved',
                'boarding_rejection_comment' => null,
                'has_warning' => false,
                'warning_comment' => null,
                'room_name' => 'Room B',
            ],
            [
                'email' => 'student.pending@sksu.edu.ph',
                'password' => 'Student@1234',
                'account_status' => 'pending',
                'student_no' => '2026-0002',
                'first_name' => 'Maria',
                'last_name' => 'Reyes',
                'gender' => 'Female',
                'course' => 'BSED',
                'year_level' => '1st Year',
                'contact_number' => '09170000002',
                'address' => 'Purok 2, Kalawag, Isulan',
                'parent_name' => 'Ana Reyes',
                'parent_contact' => '09179990002',
                'boarding_approval_status' => 'pending',
                'boarding_rejection_comment' => null,
                'has_warning' => false,
                'warning_comment' => null,
                'room_name' => null,
            ],
            [
                'email' => 'student.warning@sksu.edu.ph',
                'password' => 'Student@1234',
                'account_status' => 'rejected',
                'student_no' => '2026-0003',
                'first_name' => 'Carlo',
                'last_name' => 'Santos',
                'gender' => 'Male',
                'course' => 'BSBA',
                'year_level' => '3rd Year',
                'contact_number' => '09170000003',
                'address' => 'Purok 5, Tacurong City',
                'parent_name' => 'Lito Santos',
                'parent_contact' => '09179990003',
                'boarding_approval_status' => 'declined',
                'boarding_rejection_comment' => 'Student showed improper behavior or caused issues in the boarding house.',
                'has_warning' => true,
                'warning_comment' => 'Student showed improper behavior or caused issues in the boarding house.',
                'room_name' => null,
            ],
        ];

        foreach ($students as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => "{$data['first_name']} {$data['last_name']}",
                    'password' => Hash::make($data['password']),
                    'role' => 'student',
                    'account_status' => $data['account_status'],
                    'rejection_reason' => $data['account_status'] === 'rejected'
                        ? $data['boarding_rejection_comment']
                        : null,
                ]
            );

            $room = $data['room_name'] ? ($rooms[$data['room_name']] ?? null) : null;

            $student = Student::updateOrCreate(
                ['student_no' => $data['student_no']],
                [
                    'user_id' => $user->id,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'gender' => $data['gender'],
                    'course' => $data['course'],
                    'year_level' => $data['year_level'],
                    'contact_number' => $data['contact_number'],
                    'address' => $data['address'],
                    'parent_name' => $data['parent_name'],
                    'parent_contact' => $data['parent_contact'],
                    'boarding_house_id' => $boardingHouse->id,
                    'boarding_approval_status' => $data['boarding_approval_status'],
                    'boarding_rejection_comment' => $data['boarding_rejection_comment'],
                    'has_warning' => $data['has_warning'],
                    'warning_comment' => $data['warning_comment'],
                    'warning_marked_by' => $data['has_warning'] ? $boardingHouse->owner?->user_id : null,
                    'warning_marked_at' => $data['has_warning'] ? now() : null,
                    'room_id' => $room?->id,
                ]
            );

            StudentBoardingHistory::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'boarding_house_id' => $boardingHouse->id,
                    'vacated_at' => null,
                ],
                [
                    'boarded_at' => now(),
                    'notes' => $data['boarding_approval_status'] === 'pending'
                        ? 'Seeded pending owner approval.'
                        : 'Seeded student boarding record.',
                ]
            );

            if ($data['has_warning'] && $data['warning_comment']) {
                StudentWarning::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'owner_id' => $boardingHouse->owner?->id,
                        'comment' => $data['warning_comment'],
                    ],
                    [
                        'boarding_house_name' => $boardingHouse->boarding_name,
                    ]
                );
            }
        }

        foreach ($rooms as $room) {
            $studentCount = Student::where('room_id', $room->id)->count();
            $room->update([
                'occupied_slots' => $studentCount,
                'available_slots' => max(0, $room->capacity - $studentCount),
                'status' => $studentCount >= $room->capacity ? 'occupied' : 'available',
            ]);
        }

        $boardingHouse->syncRoomCounts();
    }
}
