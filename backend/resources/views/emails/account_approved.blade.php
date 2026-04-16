<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .header { background: #16a34a; padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 22px; }
        .body { padding: 32px 40px; color: #374151; line-height: 1.6; }
        .body h2 { margin-top: 0; color: #111827; }
        .btn { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #16a34a; color: #fff; border-radius: 6px; text-decoration: none; font-weight: 600; }
        .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Approved</h1>
        </div>
        <div class="body">
            <h2>Hello, {{ $user->name }}!</h2>
            <p>
                Great news — your <strong>{{ ucfirst($user->role) }}</strong> account for the
                <strong>Boarding House Management System</strong> has been reviewed and
                <strong>approved</strong> by the administrator.
            </p>
            <p>You can now log in and start using the system.</p>
            <a href="{{ config('app.url') }}" class="btn">Log In Now</a>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Boarding House Management System &mdash; SKSU Kalamansig
        </div>
    </div>
</body>
</html>
