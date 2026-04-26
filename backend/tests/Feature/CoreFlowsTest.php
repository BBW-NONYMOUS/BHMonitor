<?php

namespace Tests\Feature;

use App\Models\BoardingHouse;
use App\Models\Owner;
use App\Models\Room;
use App\Models\Student;
use App\Models\StudentInquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use App\Mail\AccountApproved;
use App\Mail\AccountRejected;

class CoreFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_registration_persists_profile_photo(): void
    {
        Storage::fake('public');

        $response = $this->post('/api/register-student', [
            'student_no' => '20260001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'email' => 'ivy@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'profile_photo' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

        $response->assertCreated()
            ->assertJson([
                'account_status' => 'pending',
            ]);

        $user = User::where('email', 'ivy@example.com')->firstOrFail();

        $this->assertNotNull($user->profile_photo);
        Storage::disk('public')->assertExists($user->profile_photo);
    }

    public function test_owner_can_update_settings_with_password_and_profile_photo(): void
    {
        Storage::fake('public');

        $user = User::create([
            'name' => 'Owner Display',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        Owner::create([
            'user_id' => $user->id,
            'full_name' => 'Owner Original',
            'email' => 'owner@example.com',
            'contact_number' => '09171234567',
            'address' => 'Old Address',
        ]);

        Sanctum::actingAs($user);

        $response = $this->post('/api/profile/update', [
            'name' => 'Owner Updated',
            'email' => 'updated-owner@example.com',
            'full_name' => 'Owner Legal Name',
            'contact_number' => '09999999999',
            'address' => 'New Address',
            'current_password' => 'secret123',
            'new_password' => 'newsecret123',
            'new_password_confirmation' => 'newsecret123',
            'profile_photo' => UploadedFile::fake()->image('owner-avatar.jpg'),
        ]);

        $response->assertOk()
            ->assertJsonPath('user.name', 'Owner Updated')
            ->assertJsonPath('user.email', 'updated-owner@example.com')
            ->assertJsonPath('user.full_name', 'Owner Legal Name')
            ->assertJsonPath('user.contact_number', '09999999999')
            ->assertJsonPath('user.address', 'New Address');

        $updatedUser = $user->fresh();

        $this->assertTrue(Hash::check('newsecret123', $updatedUser->password));
        $this->assertNotNull($updatedUser->profile_photo);
        Storage::disk('public')->assertExists($updatedUser->profile_photo);

        $this->assertDatabaseHas('owners', [
            'user_id' => $user->id,
            'full_name' => 'Owner Legal Name',
            'email' => 'updated-owner@example.com',
            'contact_number' => '09999999999',
            'address' => 'New Address',
        ]);
    }

    public function test_authenticated_student_reservation_keeps_address(): void
    {
        $user = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'user_id' => $user->id,
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'address' => 'Purok 1, Kalamansig',
            'contact_number' => '09171234567',
            'course' => 'BSIT',
            'year_level' => '2nd Year',
        ]);

        $ownerUser = User::create([
            'name' => 'owner1',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/reservations', [
            'boarding_house_id' => $boardingHouse->id,
            'message' => 'Interested in reserving.',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('student_inquiries', [
            'boarding_house_id' => $boardingHouse->id,
            'student_id' => $student->id,
            'address' => 'Purok 1, Kalamansig',
        ]);
    }

    public function test_guest_cannot_submit_reservation(): void
    {
        $ownerUser = User::create([
            'name' => 'owner1',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $this->postJson('/api/reservations', [
            'boarding_house_id' => $boardingHouse->id,
            'message' => 'Interested in reserving.',
        ])->assertUnauthorized();
    }

    public function test_approving_reservation_makes_student_available_for_room_assignment(): void
    {
        $ownerUser = User::create([
            'name' => 'owner1',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'contact_number' => '09171234567',
            'course' => 'BSIT',
            'year_level' => '2nd Year',
            'address' => 'Purok 1, Kalamansig',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $room = Room::create([
            'boarding_house_id' => $boardingHouse->id,
            'room_name' => 'Room 101',
            'capacity' => 4,
            'available_slots' => 4,
            'occupied_slots' => 0,
            'price' => 3500,
            'status' => 'available',
        ]);

        $reservation = StudentInquiry::create([
            'boarding_house_id' => $boardingHouse->id,
            'student_id' => $student->id,
            'full_name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'contact_number' => '09171234567',
            'address' => 'Purok 1, Kalamansig',
            'student_no' => '2026-0001',
            'course' => 'BSIT',
            'year_level' => '2nd Year',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($ownerUser);

        $this->putJson("/api/reservations/{$reservation->id}", [
            'status' => 'approved',
        ])->assertOk()
            ->assertJsonPath('reservation.student_id', $student->id);

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'boarding_house_id' => $boardingHouse->id,
        ]);

        $this->getJson("/api/boarding-houses/{$boardingHouse->id}/rooms/{$room->id}/students")
            ->assertOk()
            ->assertJsonFragment([
                'id' => $student->id,
                'student_no' => '2026-0001',
            ]);
    }

    public function test_owner_can_assign_existing_student_from_pending_reservation(): void
    {
        $ownerUser = User::create([
            'name' => 'owner1',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'contact_number' => '09171234567',
            'course' => 'BSIT',
            'year_level' => '2nd Year',
            'address' => 'Purok 1, Kalamansig',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $room = Room::create([
            'boarding_house_id' => $boardingHouse->id,
            'room_name' => 'Room 101',
            'capacity' => 4,
            'available_slots' => 4,
            'occupied_slots' => 0,
            'price' => 3500,
            'status' => 'available',
        ]);

        $reservation = StudentInquiry::create([
            'boarding_house_id' => $boardingHouse->id,
            'student_id' => $student->id,
            'full_name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'contact_number' => '09171234567',
            'address' => 'Purok 1, Kalamansig',
            'student_no' => '2026-0001',
            'course' => 'BSIT',
            'year_level' => '2nd Year',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($ownerUser);

        $this->postJson('/api/students/from-reservation', [
            'reservation_id' => $reservation->id,
            'room_id' => $room->id,
        ])->assertOk()
            ->assertJsonPath('id', $student->id)
            ->assertJsonPath('boarding_house_id', $boardingHouse->id)
            ->assertJsonPath('room_id', $room->id);

        $this->assertDatabaseHas('student_inquiries', [
            'id' => $reservation->id,
            'student_id' => $student->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'boarding_house_id' => $boardingHouse->id,
            'room_id' => $room->id,
        ]);
    }

    public function test_student_can_view_their_own_reservations(): void
    {
        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
        ]);

        $ownerUser = User::create([
            'name' => 'owner1',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        StudentInquiry::create([
            'boarding_house_id' => $boardingHouse->id,
            'student_id' => $student->id,
            'full_name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'contact_number' => '09171234567',
            'student_no' => '2026-0001',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($studentUser);

        $this->getJson('/api/my-reservations')
            ->assertOk()
            ->assertJsonFragment([
                'student_id' => $student->id,
                'status' => 'pending',
            ])
            ->assertJsonFragment([
                'boarding_name' => 'Blue House',
            ]);
    }

    public function test_admin_can_approve_pending_account_and_send_email(): void
    {
        Mail::fake();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $studentUser = User::create([
            'name' => 'Pending Student',
            'email' => 'student@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/accounts/{$studentUser->id}/approve")
            ->assertOk()
            ->assertJsonPath('user.account_status', 'approved');

        $this->assertDatabaseHas('users', [
            'id' => $studentUser->id,
            'account_status' => 'approved',
            'rejection_reason' => null,
        ]);

        Mail::assertSent(AccountApproved::class, fn (AccountApproved $mail) => $mail->hasTo('student@example.com'));
    }

    public function test_admin_can_reject_pending_account_and_send_email(): void
    {
        Mail::fake();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $ownerUser = User::create([
            'name' => 'Pending Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/accounts/{$ownerUser->id}/reject", [
            'rejection_reason' => 'Incomplete requirements.',
        ])->assertOk()
            ->assertJsonPath('user.account_status', 'rejected');

        $this->assertDatabaseHas('users', [
            'id' => $ownerUser->id,
            'account_status' => 'rejected',
            'rejection_reason' => 'Incomplete requirements.',
        ]);

        Mail::assertSent(AccountRejected::class, fn (AccountRejected $mail) => $mail->hasTo('owner@example.com'));
    }

    public function test_admin_deactivation_soft_deletes_user_and_preserves_student_reservations(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
        ]);

        $ownerUser = User::create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $reservation = StudentInquiry::create([
            'boarding_house_id' => $boardingHouse->id,
            'student_id' => $student->id,
            'full_name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'contact_number' => '09171234567',
            'student_no' => '2026-0001',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/accounts/{$studentUser->id}")
            ->assertOk()
            ->assertJsonFragment([
                'message' => 'Account for Ivy Santos deactivated. Linked student, boarding house, and reservation data were preserved.',
            ]);

        $this->assertSoftDeleted('users', ['id' => $studentUser->id]);
        $this->assertDatabaseHas('students', ['id' => $student->id, 'user_id' => $studentUser->id]);
        $this->assertDatabaseHas('student_inquiries', ['id' => $reservation->id, 'student_id' => $student->id]);
    }

    public function test_admin_can_restore_soft_deleted_account(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);
        $studentUser->delete();

        Sanctum::actingAs($admin);

        $this->putJson("/api/accounts/{$studentUser->id}/restore")
            ->assertOk()
            ->assertJsonPath('user.is_deleted', false);

        $this->assertDatabaseHas('users', ['id' => $studentUser->id, 'deleted_at' => null]);
    }

    public function test_inactive_student_account_cannot_reserve(): void
    {
        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'rejected',
        ]);

        Student::create([
            'user_id' => $studentUser->id,
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
        ]);

        $ownerUser = User::create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        Sanctum::actingAs($studentUser);

        $this->postJson('/api/reservations', [
            'boarding_house_id' => $boardingHouse->id,
        ])->assertForbidden()
            ->assertJsonFragment(['message' => 'Reservation cannot proceed due to inactive account.']);
    }

    public function test_admin_cannot_manage_room_assignments(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $ownerUser = User::create([
            'name' => 'owner1',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $room = Room::create([
            'boarding_house_id' => $boardingHouse->id,
            'room_name' => 'Room 101',
            'capacity' => 4,
            'available_slots' => 4,
            'occupied_slots' => 0,
            'price' => 3500,
            'status' => 'available',
        ]);

        $student = Student::create([
            'student_no' => '2026-0001',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'boarding_house_id' => $boardingHouse->id,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/boarding-houses/{$boardingHouse->id}/rooms/{$room->id}/students")
            ->assertForbidden();

        $this->postJson("/api/boarding-houses/{$boardingHouse->id}/rooms/{$room->id}/add-student", [
            'student_id' => $student->id,
        ])->assertForbidden();

        $student->update(['room_id' => $room->id]);

        $this->deleteJson("/api/boarding-houses/{$boardingHouse->id}/rooms/{$room->id}/students/{$student->id}")
            ->assertForbidden();
    }

    public function test_admin_backup_restore_works_with_json_backup(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'student_no' => '2026-0001',
            'first_name' => 'Before',
            'last_name' => 'Restore',
        ]);

        Sanctum::actingAs($admin);

        $backup = json_encode([
            'meta' => [
                'format' => 'json-backup-v1',
            ],
            'tables' => [
                'users' => [
                    [
                        'id' => $admin->id,
                        'name' => 'Admin',
                        'email' => 'admin@example.com',
                        'email_verified_at' => null,
                        'password' => $admin->password,
                        'remember_token' => null,
                        'role' => 'admin',
                        'account_status' => 'approved',
                        'profile_photo' => null,
                        'rejection_reason' => null,
                        'created_at' => $admin->created_at?->toDateTimeString(),
                        'updated_at' => $admin->updated_at?->toDateTimeString(),
                    ],
                ],
                'students' => [
                    [
                        'id' => $student->id,
                        'user_id' => null,
                        'student_no' => '2026-0001',
                        'first_name' => 'After',
                        'last_name' => 'Restore',
                        'gender' => null,
                        'course' => null,
                        'year_level' => null,
                        'contact_number' => null,
                        'address' => null,
                        'parent_name' => null,
                        'parent_contact' => null,
                        'image' => null,
                        'boarding_house_id' => null,
                        'room_id' => null,
                        'created_at' => $student->created_at?->toDateTimeString(),
                        'updated_at' => now()->toDateTimeString(),
                    ],
                ],
                'activity_logs' => [],
            ],
        ], JSON_PRETTY_PRINT);

        $file = UploadedFile::fake()->createWithContent('backup.json', $backup);

        $this->post('/api/backup/restore', [
            'backup_file' => $file,
        ])->assertOk();

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'first_name' => 'After',
            'last_name' => 'Restore',
        ]);
    }

    public function test_admin_backup_export_contains_valid_json_snapshot(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'student_no' => '2026-0001',
            'first_name' => 'Original',
            'last_name' => 'Student',
        ]);

        Sanctum::actingAs($admin);

        $exportResponse = $this->get('/api/backup/export');
        $exportResponse->assertOk();

        $payload = json_decode($exportResponse->streamedContent(), true);

        $this->assertIsArray($payload);
        $this->assertSame('json-backup-v1', $payload['meta']['format'] ?? null);
        $this->assertArrayHasKey('students', $payload['tables'] ?? []);
        $this->assertTrue(collect($payload['tables']['students'])->contains(fn ($row) => (int) $row['id'] === $student->id && $row['first_name'] === 'Original'));
    }

    public function test_admin_backup_export_works_on_sqlite(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->get('/api/backup/export');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/json');
        $this->assertStringContainsString('backup_', (string) $response->headers->get('content-disposition'));
    }

    public function test_owner_removing_student_preserves_account_and_cleans_reservations(): void
    {
        $ownerUser = User::create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $owner = Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Owner One',
            'email' => 'owner@example.com',
        ]);

        $boardingHouse = BoardingHouse::create([
            'owner_id' => $owner->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $studentUser = User::create([
            'name' => 'Ivy Santos',
            'email' => 'ivy-delete@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'student',
            'account_status' => 'approved',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_no' => '20260099',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'boarding_house_id' => $boardingHouse->id,
            'boarding_approval_status' => 'approved',
        ]);

        $reservation = StudentInquiry::create([
            'boarding_house_id' => $boardingHouse->id,
            'student_id' => $student->id,
            'full_name' => 'Ivy Santos',
            'email' => 'ivy-delete@example.com',
            'contact_number' => '09171234567',
            'student_no' => '20260099',
            'status' => 'approved',
        ]);

        Sanctum::actingAs($ownerUser);

        $this->deleteJson("/api/students/{$student->id}")
            ->assertOk()
            ->assertJsonFragment([
                'message' => 'Student removed from this boarding house. Account remains active.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $studentUser->id,
            'deleted_at' => null,
        ]);
        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'user_id' => $studentUser->id,
            'boarding_house_id' => null,
            'room_id' => null,
            'boarding_approval_status' => null,
        ]);
        $this->assertDatabaseMissing('student_inquiries', ['id' => $reservation->id]);
    }

    public function test_student_registration_rejects_non_numeric_student_id(): void
    {
        $this->postJson('/api/register-student', [
            'student_no' => 'ABC123',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'email' => 'numeric@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['student_no']);
    }

    public function test_reservation_approval_is_blocked_when_student_is_already_registered_elsewhere(): void
    {
        $ownerUserOne = User::create([
            'name' => 'Owner One',
            'email' => 'owner-one@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $ownerOne = Owner::create([
            'user_id' => $ownerUserOne->id,
            'full_name' => 'Owner One',
            'email' => 'owner-one@example.com',
        ]);

        $ownerUserTwo = User::create([
            'name' => 'Owner Two',
            'email' => 'owner-two@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'approved',
        ]);

        $ownerTwo = Owner::create([
            'user_id' => $ownerUserTwo->id,
            'full_name' => 'Owner Two',
            'email' => 'owner-two@example.com',
        ]);

        $boardingHouseOne = BoardingHouse::create([
            'owner_id' => $ownerOne->id,
            'boarding_name' => 'Blue House',
            'address' => 'Campus Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $boardingHouseTwo = BoardingHouse::create([
            'owner_id' => $ownerTwo->id,
            'boarding_name' => 'Green House',
            'address' => 'Market Road',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $student = Student::create([
            'student_no' => '20260100',
            'first_name' => 'Ivy',
            'last_name' => 'Santos',
            'boarding_house_id' => $boardingHouseOne->id,
            'boarding_approval_status' => 'approved',
        ]);

        $reservation = StudentInquiry::create([
            'boarding_house_id' => $boardingHouseTwo->id,
            'student_id' => $student->id,
            'full_name' => 'Ivy Santos',
            'email' => 'ivy-conflict@example.com',
            'contact_number' => '09171234567',
            'student_no' => '20260100',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($ownerUserTwo);

        $this->putJson("/api/reservations/{$reservation->id}", [
            'status' => 'approved',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['student_id'])
            ->assertJsonPath('errors.student_id.0', 'You are already registered in a boarding house');

        $this->assertDatabaseHas('student_inquiries', [
            'id' => $reservation->id,
            'status' => 'pending',
        ]);
    }

    public function test_owner_account_approval_creates_bell_notification_without_reservation_record(): void
    {
        Mail::fake();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin-notify@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'account_status' => 'approved',
        ]);

        $ownerUser = User::create([
            'name' => 'Pending Owner',
            'email' => 'pending-owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'account_status' => 'pending',
        ]);

        Owner::create([
            'user_id' => $ownerUser->id,
            'full_name' => 'Pending Owner',
            'email' => 'pending-owner@example.com',
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/accounts/{$ownerUser->id}/approve")
            ->assertOk()
            ->assertJsonPath('user.account_status', 'approved');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $ownerUser->id,
            'type' => 'account_approved',
        ]);
        $this->assertDatabaseCount('student_inquiries', 0);
    }
}
