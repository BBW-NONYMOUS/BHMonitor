<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .header { background: #dc2626; padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 22px; }
        .body { padding: 32px 40px; color: #374151; line-height: 1.6; }
        .body h2 { margin-top: 0; color: #111827; }
        .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #7f1d1d; }
        .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Not Approved</h1>
        </div>
        <div class="body">
            <h2>Hello, {{ $user->name }}.</h2>
            <p>
                Unfortunately, your <strong>{{ ucfirst($user->role) }}</strong> account registration for the
                <strong>Boarding House Management System</strong> was <strong>not approved</strong>
                by the administrator.
            </p>
            @if($reason)
            <p>Reason provided:</p>
            <div class="reason-box">{{ $reason }}</div>
            @endif
            <p>If you believe this is a mistake or would like to appeal, please contact the system administrator directly.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Boarding House Management System &mdash; SKSU Kalamansig
        </div>
    </div>
</body>
</html>
