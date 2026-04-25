<?php

namespace Database\Seeders;

use App\Models\BoardingHouse;
use App\Models\Owner;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Create default admin account (change password after first login)
        User::firstOrCreate(
            ['email' => 'admin@sksu.edu.ph'],
            [
                'name'     => 'admin',
                'password' => Hash::make('Admin@1234'),
                'role'     => 'admin',
            ]
        );

        $ownerUser = User::updateOrCreate(
            ['email' => 'owner1@sksu.edu.ph'],
            [
                'name'     => 'owner_demo',
                'password' => Hash::make('Owner@1234'),
                'role'     => 'owner',
            ]
        );

        $owner = Owner::updateOrCreate(
            ['user_id' => $ownerUser->id],
            [
                'full_name'      => 'Maria Santos',
                'contact_number' => '09171234567',
                'email'          => 'owner1@sksu.edu.ph',
                'address'        => 'Purok 3, Barangay Kalawag, Isulan, Sultan Kudarat',
            ]
        );

        $boardingHouse = BoardingHouse::updateOrCreate(
            ['owner_id' => $owner->id, 'boarding_name' => 'Sunrise BH'],
            [
                'address'         => 'Near SKSU Main Campus, Isulan, Sultan Kudarat',
                'description'     => 'Clean and quiet boarding house for students with secure entry and study-friendly rooms.',
                'facilities'      => 'WiFi, Study Area, Laundry Area, Shared Kitchen, CCTV',
                'room_rate'       => 0,
                'total_rooms'     => 0,
                'available_rooms' => 0,
                'latitude'        => 6.62950000,
                'longitude'       => 124.60620000,
                'status'          => 'active',
                'approval_status' => 'approved',
            ]
        );

        $rooms = [
            [
                'room_name'       => 'Room A',
                'capacity'        => 4,
                'occupied_slots'  => 2,
                'available_slots' => 2,
                'price'           => 1800,
                'status'          => 'available',
                'gender_type'     => 'Female',
                'amenities'       => '2 bunk beds, fan, cabinet, shared CR',
            ],
            [
                'room_name'       => 'Room B',
                'capacity'        => 3,
                'occupied_slots'  => 1,
                'available_slots' => 2,
                'price'           => 2000,
                'status'          => 'available',
                'gender_type'     => 'Male',
                'amenities'       => 'single beds, fan, study table, shared CR',
            ],
            [
                'room_name'       => 'Room C',
                'capacity'        => 2,
                'occupied_slots'  => 2,
                'available_slots' => 0,
                'price'           => 2200,
                'status'          => 'occupied',
                'gender_type'     => 'Mixed',
                'amenities'       => 'double deck, cabinet, private sink',
            ],
        ];

        foreach ($rooms as $room) {
            Room::updateOrCreate(
                [
                    'boarding_house_id' => $boardingHouse->id,
                    'room_name'         => $room['room_name'],
                ],
                $room
            );
        }

        $boardingHouse->syncRoomCounts();

        $this->call(StudentSeeder::class);
    }
}
