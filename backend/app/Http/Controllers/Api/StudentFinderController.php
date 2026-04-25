<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoardingHouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentFinderController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $sort   = $request->get('sort', 'latest');
        $lat    = $request->get('lat');
        $lng    = $request->get('lng');

        $query = BoardingHouse::with('owner')
            ->where('status', 'active')
            ->where('approval_status', 'approved');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('boarding_name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }
        if ($maxPrice = $request->get('max_price')) {
            $query->where('room_rate', '<=', $maxPrice);
        }
        if ($facilities = $request->get('facilities')) {
            $query->where('facilities', 'like', "%{$facilities}%");
        }
        $genderType = $request->get('gender_type');
        if ($genderType && $genderType !== 'all') {
            $query->whereHas('rooms', fn ($q) => $q->where('gender_type', $genderType)->where('available_slots', '>', 0));
        }
        if ($availability = $request->get('availability')) {
            $statuses = array_filter(explode(',', (string) $availability));
            if (!empty($statuses)) {
                $query->where(function ($q) use ($statuses) {
                    if (in_array('available', $statuses, true)) {
                        $q->orWhere('available_rooms', '>', 0);
                    }
                    if (in_array('full', $statuses, true)) {
                        $q->orWhere('available_rooms', '<=', 0);
                    }
                });
            }
        }

        // Nearest: fetch all matching records, compute distance in PHP, sort, return
        if ($sort === 'nearest' && $lat && $lng) {
            $all = $query->get()->map(function ($bh) use ($lat, $lng) {
                $bh->distance = $this->haversine((float) $lat, (float) $lng, $bh->latitude, $bh->longitude);
                return $bh;
            })->sortBy('distance')->values();

            return response()->json(['data' => $all]);
        }

        if ($sort === 'price_asc') {
            $query->orderBy('room_rate');
        } else {
            $query->orderByDesc('created_at');
        }

        $perPage = min((int) $request->get('per_page', 12), 100);

        return response()->json($query->paginate(max($perPage, 1)));
    }

    public function show(int $id): JsonResponse
    {
        $bh = BoardingHouse::with(['owner:id,full_name,contact_number', 'rooms' => fn ($q) => $q->with('photos')->orderBy('room_name')])
            ->where('status', 'active')
            ->where('approval_status', 'approved')
            ->findOrFail($id);

        return response()->json($bh);
    }

    private function haversine(float $lat1, float $lng1, ?float $lat2, ?float $lng2): float
    {
        if (!$lat2 || !$lng2) return PHP_FLOAT_MAX;

        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
