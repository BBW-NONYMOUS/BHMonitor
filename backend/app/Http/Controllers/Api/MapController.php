<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoardingHouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapController extends Controller
{
    public function markers(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = BoardingHouse::with('owner')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('status', 'active');

        if ($user->isOwner()) {
            $query->where('owner_id', $user->owner?->id);
        }

        $markers = $query->get()->map(fn ($bh) => [
            'id'            => $bh->id,
            'name'          => $bh->boarding_name,
            'address'       => $bh->address,
            'latitude'      => $bh->latitude,
            'longitude'     => $bh->longitude,
            'available'     => $bh->available_rooms,
            'rate'          => $bh->room_rate,
            'owner'         => $bh->owner?->full_name,
            'owner_contact' => $bh->owner?->contact_number,
            'owner_email'   => $bh->owner?->email,
        ]);

        return response()->json($markers);
    }

    public function publicMarkers(): JsonResponse
    {
        $markers = BoardingHouse::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('status', 'active')
            ->where('approval_status', 'approved')
            ->get()
            ->map(fn ($bh) => [
                'id'        => $bh->id,
                'name'      => $bh->boarding_name,
                'address'   => $bh->address,
                'latitude'  => $bh->latitude,
                'longitude' => $bh->longitude,
                'available' => $bh->available_rooms,
                'rate'      => $bh->room_rate,
            ]);

        return response()->json($markers);
    }
}
