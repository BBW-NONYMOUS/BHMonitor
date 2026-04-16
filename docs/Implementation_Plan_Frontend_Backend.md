# Boarding House Management System - Implementation Plan

## Overview
This document provides a detailed implementation plan for frontend and backend development based on the analyzed requirements.

---

## Phase 1: Core Fixes & Room Management (Weeks 1-2)

### Backend Tasks (Priority: High)

#### Database Schema Updates
```sql
-- 1. Add slot_capacity to rooms table
ALTER TABLE rooms ADD COLUMN slot_capacity INT DEFAULT 3;

-- 2. Add student_count computed/virtual column (or use trigger)
-- Track current occupancy per room

-- 3. Add room_images table for multiple images
CREATE TABLE room_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT,
    image_path VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 4. Add address field to students table
ALTER TABLE students ADD COLUMN permanent_address TEXT;

-- 5. Add status field to users for approval workflow
ALTER TABLE users ADD COLUMN account_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE users ADD COLUMN rejection_reason TEXT NULL;

-- 6. Add multiple BH support (if not exists)
ALTER TABLE rooms ADD COLUMN boarding_house_id INT;
ALTER TABLE students ADD COLUMN assigned_boarding_house_id INT;
```

#### API Development

| Endpoint | Method | Description | Auth Role |
|----------|--------|-------------|-----------|
| `/api/rooms` | POST | Create room (Owner only) | bh_owner |
| `/api/rooms/:id` | PUT | Update room (Owner only) | bh_owner |
| `/api/rooms/:id` | DELETE | Delete room (Admin/Owner) | admin, bh_owner |
| `/api/rooms/:id/assign-student` | POST | Assign student to room | bh_owner |
| `/api/rooms/:id/occupancy` | GET | Get current occupancy count | any |
| `/api/rooms/:id/status` | GET | Auto-computed status | any |

**Room Status Logic (Backend)**:
```javascript
function computeRoomStatus(room) {
    const occupancy = room.students_count;
    const capacity = room.slot_capacity;
    
    if (occupancy === 0) return 'available';
    if (occupancy >= capacity) return 'full';
    return 'limited';
}
```

**Validation Middleware**:
```javascript
// Prevent overbooking
function validateRoomCapacity(req, res, next) {
    const room = req.room;
    const currentCount = room.students_count;
    const capacity = room.slot_capacity;
    
    if (currentCount >= capacity) {
        return res.status(400).json({ error: 'Room is at full capacity' });
    }
    next();
}
```

#### Admin Permission Updates
```javascript
// Middleware: Restrict admin from creating/editing rooms
function restrictAdminRoomManagement(req, res, next) {
    if (req.user.role === 'admin' && (req.method === 'POST' || req.method === 'PUT')) {
        return res.status(403).json({ error: 'Admin cannot create or edit rooms' });
    }
    next();
}
```

### Frontend Tasks (Priority: High)

#### Component Updates

| Component | Changes |
|-----------|---------|
| `RoomCard.jsx` | Add "Assign Student" button, show slot usage (e.g., "2/3 slots"), auto-computed status badge |
| `RoomList.jsx` | Add availability filter buttons (All, Available, Limited, Full) |
| `AddRoomForm.jsx` | Add slot capacity input, multi-image upload (min 3), BH selection dropdown |
| `EditRoomForm.jsx` | Modify for owner-only access, image gallery management |

**RoomCard.jsx Implementation**:
```jsx
function RoomCard({ room }) {
    const status = computeStatus(room.occupancy, room.slot_capacity);
    const isFull = room.occupancy >= room.slot_capacity;
    
    return (
        <div className="room-card">
            <StatusBadge status={status} />
            <div className="slot-indicator">
                {room.occupancy} / {room.slot_capacity} slots filled
            </div>
            {!isFull && userRole === 'bh_owner' && (
                <button onClick={() => openAssignStudentModal(room)}>
                    Assign Student
                </button>
            )}
        </div>
    );
}
```

#### Admin UI Restrictions
```jsx
// In RoomManagement page
{userRole === 'admin' && (
    <>
        {/* View only - no Add/Edit buttons */}
        <RoomList readOnly={true} showDelete={true} />
    </>
)}

{userRole === 'bh_owner' && (
    <>
        <AddRoomButton />
        <RoomList readOnly={false} showDelete={true} showEdit={true} />
    </>
)}
```

---

## Phase 2: User Management & Approval Workflow (Weeks 2-3)

### Backend Tasks (Priority: High)

#### Email Integration (SMTP)
```javascript
// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendApprovalEmail = async (user) => {
    await transporter.sendMail({
        to: user.email,
        subject: 'Your Account Has Been Approved',
        html: `<p>Hello ${user.name},</p>
               <p>Your account has been approved by the admin.</p>
               <p>You can now log in and access all features.</p>`
    });
};

exports.sendRejectionEmail = async (user, reason) => {
    await transporter.sendMail({
        to: user.email,
        subject: 'Account Registration Update',
        html: `<p>Hello ${user.name},</p>
               <p>Your account registration was not approved.</p>
               <p>Reason: ${reason}</p>
               <p>You may reapply with corrected information.</p>`
    });
};
```

#### New API Endpoints

| Endpoint | Method | Description | Auth Role |
|----------|--------|-------------|-----------|
| `/api/admin/pending-accounts` | GET | List pending approvals | admin |
| `/api/admin/approve-account` | POST | Approve user account | admin |
| `/api/admin/reject-account` | POST | Reject user account | admin |
| `/api/users/upload-avatar` | POST | Upload profile picture | any |

**Approval Workflow Implementation**:
```javascript
// controllers/adminController.js
exports.approveAccount = async (req, res) => {
    const { userId } = req.body;
    
    const user = await User.findByIdAndUpdate(userId, {
        account_status: 'approved',
        approved_at: new Date()
    });
    
    await sendApprovalEmail(user);
    
    res.json({ message: 'Account approved successfully' });
};

exports.rejectAccount = async (req, res) => {
    const { userId, reason } = req.body;
    
    const user = await User.findByIdAndUpdate(userId, {
        account_status: 'rejected',
        rejection_reason: reason
    });
    
    await sendRejectionEmail(user, reason);
    
    res.json({ message: 'Account rejected' });
};
```

#### Image Upload Service
```javascript
// services/uploadService.js
const multer = require('multer');
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'));
        }
    }
});

exports.processAvatar = async (file) => {
    const processed = await sharp(file.buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
    
    // Save to storage (S3, local, etc.)
    return saveToStorage(processed, 'avatars');
};
```

### Frontend Tasks (Priority: High)

#### New Components

| Component | Purpose |
|-------------|---------|
| `AdminApprovalDashboard.jsx` | List pending accounts with Approve/Reject actions |
| `ApprovalModal.jsx` | Confirmation modal with optional rejection reason |
| `AvatarUpload.jsx` | Profile picture upload with preview and cropping |
| `ImageGallery.jsx` | Multi-image upload for rooms (drag & drop) |

**AdminApprovalDashboard.jsx**:
```jsx
function AdminApprovalDashboard() {
    const [pendingUsers, setPendingUsers] = useState([]);
    
    const handleApprove = async (userId) => {
        await api.post('/admin/approve-account', { userId });
        toast.success('Account approved');
        refreshList();
    };
    
    const handleReject = async (userId, reason) => {
        await api.post('/api/admin/reject-account', { userId, reason });
        toast.success('Account rejected');
        refreshList();
    };
    
    return (
        <div className="approval-dashboard">
            <h2>Pending Account Approvals</h2>
            {pendingUsers.map(user => (
                <UserApprovalCard 
                    key={user.id} 
                    user={user}
                    onApprove={() => handleApprove(user.id)}
                    onReject={(reason) => handleReject(user.id, reason)}
                />
            ))}
        </div>
    );
}
```

**AvatarUpload.jsx**:
```jsx
function AvatarUpload({ currentAvatar, onUpload }) {
    const [preview, setPreview] = useState(currentAvatar);
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
            onUpload(file);
        } else {
            toast.error('File must be less than 5MB');
        }
    };
    
    return (
        <div className="avatar-upload">
            <img src={preview || '/default-avatar.png'} alt="Avatar" />
            <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}
```

#### Registration Form Updates
```jsx
// Add to StudentRegistration.jsx
<TextField
    label="Student ID"  // Changed from "Student No"
    name="student_id"
    required
/>
<TextField
    label="Permanent Address"
    name="permanent_address"
    multiline
    rows={3}
    required
/>
<AvatarUpload onUpload={handleAvatarUpload} />
```

---

## Phase 3: Reservation System (Weeks 3-4)

### Backend Tasks (Priority: High)

#### Database Schema for Reservations
```sql
-- Reservations table (replaces or enhances inquiries)
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    room_id INT,
    boarding_house_id INT,
    preferred_move_in_date DATE,
    year_level ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'),
    message TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id)
);
```

#### New API Endpoints

| Endpoint | Method | Description | Auth Role |
|----------|--------|-------------|-----------|
| `/api/reservations` | POST | Create reservation | student |
| `/api/reservations` | GET | List user's reservations | any |
| `/api/reservations/:id/approve` | POST | Approve reservation | bh_owner |
| `/api/reservations/:id/reject` | POST | Reject reservation | bh_owner |
| `/api/reservations/pending` | GET | Get pending reservations for owner | bh_owner |

**Reservation Controller**:
```javascript
// controllers/reservationController.js
exports.createReservation = async (req, res) => {
    const { room_id, preferred_move_in_date, year_level, message } = req.body;
    const student_id = req.user.student_id;
    
    // Auto-fetch student info from profile
    const student = await Student.findById(student_id);
    
    const reservation = await Reservation.create({
        student_id,
        room_id,
        boarding_house_id: req.body.boarding_house_id,
        preferred_move_in_date,
        year_level,
        message,
        status: 'pending',
        // Auto-populated from student profile
        student_name: student.name,
        student_contact: student.contact,
        student_address: student.permanent_address
    });
    
    // Notify owner
    await notifyOwnerOfReservation(reservation);
    
    res.status(201).json({ message: 'Reservation submitted', reservation });
};

exports.approveReservation = async (req, res) => {
    const reservation = await Reservation.findByIdAndUpdate(
        req.params.id,
        { status: 'approved', approved_at: new Date() }
    );
    
    // Notify student
    await notifyStudentOfApproval(reservation);
    
    res.json({ message: 'Reservation approved' });
};
```

#### Direct Add from Reservation
```javascript
exports.directAddFromReservation = async (req, res) => {
    const { reservation_id } = req.body;
    
    const reservation = await Reservation.findById(reservation_id);
    
    // Create student record from reservation data
    const student = await Student.create({
        name: reservation.student_name,
        contact: reservation.student_contact,
        address: reservation.student_address,
        student_id: reservation.student_id,
        room_id: reservation.room_id,
        boarding_house_id: reservation.boarding_house_id,
        year_level: reservation.year_level,
        move_in_date: reservation.preferred_move_in_date
    });
    
    // Update room occupancy
    await Room.findByIdAndUpdate(reservation.room_id, {
        $inc: { students_count: 1 }
    });
    
    // Mark reservation as completed
    await Reservation.findByIdAndUpdate(reservation_id, {
        status: 'converted'
    });
    
    res.json({ message: 'Student added successfully', student });
};
```

### Frontend Tasks (Priority: High)

#### New Components

| Component | Purpose |
|-------------|---------|
| `ReservationForm.jsx` | Streamlined reservation form |
| `ReservationCard.jsx` | Display reservation details |
| `OwnerReservations.jsx` | List and manage reservations |
| `AssignStudentModal.jsx` | Two-tab modal (From Reservations / Manual) |

**ReservationForm.jsx** (Replaces Send Inquiry):
```jsx
function ReservationForm({ room, boardingHouse }) {
    const { user } = useAuth(); // Auto-populated from profile
    
    const [formData, setFormData] = useState({
        preferred_move_in_date: '',
        year_level: '',
        message: ''
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/api/reservations', {
            room_id: room.id,
            boarding_house_id: boardingHouse.id,
            ...formData
        });
        toast.success('Reservation submitted!');
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Student info displayed (read-only, from profile) */}
            <ReadOnlyField label="Name" value={user.name} />
            <ReadOnlyField label="Contact" value={user.contact} />
            <ReadOnlyField label="Address" value={user.permanent_address} />
            
            {/* Room info displayed (read-only) */}
            <ReadOnlyField label="Room" value={room.name} />
            <ReadOnlyField label="Price" value={room.price} />
            
            {/* Input fields */}
            <DatePicker
                label="Preferred Move-in Date"
                value={formData.preferred_move_in_date}
                onChange={(date) => setFormData({...formData, preferred_move_in_date: date})}
                minDate={new Date()}
            />
            
            <Select
                label="Year Level"
                value={formData.year_level}
                onChange={(e) => setFormData({...formData, year_level: e.target.value})}
                options={['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']}
            />
            
            <TextArea
                label="Message to Owner (Optional)"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                maxLength={1000}
            />
            
            <Button type="submit">Submit Reservation</Button>
        </form>
    );
}
```

**AssignStudentModal.jsx**:
```jsx
function AssignStudentModal({ room, isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('reservations'); // or 'manual'
    const [pendingReservations, setPendingReservations] = useState([]);
    
    const handleDirectAdd = async (reservationId) => {
        await api.post('/api/students/direct-add', { reservation_id: reservationId });
        toast.success('Student added from reservation');
        onClose();
    };
    
    const handleManualAdd = async (formData) => {
        await api.post('/api/students', { ...formData, room_id: room.id });
        toast.success('Student added manually');
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Student to Room">
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tab label="From Approved Reservations" value="reservations" />
                <Tab label="Manual Entry" value="manual" />
            </Tabs>
            
            {activeTab === 'reservations' && (
                <ReservationsList 
                    reservations={pendingReservations}
                    onSelect={handleDirectAdd}
                />
            )}
            
            {activeTab === 'manual' && (
                <ManualStudentForm 
                    onSubmit={handleManualAdd}
                />
            )}
        </Modal>
    );
}
```

---

## Phase 4: Map & Discovery (Weeks 4-5)

### Backend Tasks (Priority: Medium)

#### Public API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/public/boarding-houses` | GET | List all BH (limited fields) | none |
| `/api/public/boarding-houses/:id` | GET | BH details (limited info) | none |

**Public BH Response (Limited Data)**:
```javascript
exports.getPublicBoardingHouses = async (req, res) => {
    const boardingHouses = await BoardingHouse.findAll({
        attributes: ['id', 'name', 'latitude', 'longitude', 'price_range', 'status'],
        include: [{
            model: Room,
            attributes: ['status'] // Only status, not details
        }]
    });
    
    // Return only what's needed for map display
    const publicData = boardingHouses.map(bh => ({
        id: bh.id,
        name: bh.name,
        location: { lat: bh.latitude, lng: bh.longitude },
        price_range: bh.price_range,
        availability_status: computeOverallStatus(bh.rooms)
    }));
    
    res.json(publicData);
};
```

### Frontend Tasks (Priority: Medium)

#### Map Configuration
```jsx
// MapComponent.jsx updates
const DEFAULT_CENTER = {
    lat: 6.5409,  // SKSU Kalamansig Campus approximate
    lng: 124.0522
};

const DEFAULT_ZOOM = 16;
const DEFAULT_MAP_TYPE = 'satellite'; // or 'hybrid'

function MapComponent() {
    return (
        <GoogleMap
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={DEFAULT_ZOOM}
            defaultMapTypeId={DEFAULT_MAP_TYPE}
            options={{
                mapTypeControl: true, // Allow users to switch views
                streetViewControl: false
            }}
        >
            {/* Markers with availability filtering */}
        </GoogleMap>
    );
}
```

#### Availability Filters
```jsx
function AvailabilityFilters({ activeFilters, onFilterChange }) {
    const filters = [
        { key: 'available', label: 'Available', color: 'green' },
        { key: 'limited', label: 'Limited', color: 'yellow' },
        { key: 'full', label: 'Full', color: 'red' }
    ];
    
    return (
        <div className="availability-filters">
            {filters.map(filter => (
                <FilterChip
                    key={filter.key}
                    label={filter.label}
                    color={filter.color}
                    active={activeFilters.includes(filter.key)}
                    onClick={() => onFilterChange(filter.key)}
                />
            ))}
        </div>
    );
}
```

#### Auth Gate for Reservation
```jsx
function BoardingHouseMarker({ boardingHouse }) {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    
    const handleReserveClick = () => {
        if (!isAuthenticated) {
            // Show login modal or redirect
            navigate('/login', { 
                state: { 
                    redirectAfter: `/reserve/${boardingHouse.id}`,
                    message: 'Please sign in to reserve this boarding house'
                }
            });
            return;
        }
        
        if (user.role !== 'student') {
            toast.error('Only students can make reservations');
            return;
        }
        
        navigate(`/reserve/${boardingHouse.id}`);
    };
    
    return (
        <Marker position={boardingHouse.location}>
            <InfoWindow>
                <div>
                    <h3>{boardingHouse.name}</h3>
                    <p>Price: {boardingHouse.price_range}</p>
                    <StatusBadge status={boardingHouse.availability_status} />
                    <button onClick={handleReserveClick}>
                        {isAuthenticated ? 'Reserve Now' : 'Sign In to Reserve'}
                    </button>
                </div>
            </InfoWindow>
        </Marker>
    );
}
```

---

## Phase 5: System Enhancements (Weeks 5-6)

### Backend Tasks (Priority: High)

#### Database Backup Service
```javascript
// services/backupService.js
const { exec } = require('child_process');
const cron = require('node-cron');
const path = require('path');

// Schedule daily backup at 2:00 AM
cron.schedule('0 2 * * *', () => {
    createBackup();
});

exports.createBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(__dirname, '../backups', filename);
    
    const command = `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} > ${filepath}`;
    
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) reject(error);
            else resolve(filepath);
        });
    });
};

exports.restoreBackup = async (backupPath) => {
    const command = `mysql -u ${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} < ${backupPath}`;
    
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

// Cleanup old backups (keep 30 days)
exports.cleanupOldBackups = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Delete backup files older than 30 days
    // Implementation depends on storage strategy
};
```

#### Backup API Endpoints

| Endpoint | Method | Description | Auth Role |
|----------|--------|-------------|-----------|
| `/api/admin/backups` | GET | List all backups | admin |
| `/api/admin/backups` | POST | Trigger manual backup | admin |
| `/api/admin/backups/:id/restore` | POST | Restore from backup | admin |
| `/api/admin/backups/:id/download` | GET | Download backup file | admin |

### Frontend Tasks (Priority: Medium)

#### Admin Backup Dashboard
```jsx
function BackupDashboard() {
    const [backups, setBackups] = useState([]);
    const [isRestoring, setIsRestoring] = useState(false);
    
    const handleManualBackup = async () => {
        await api.post('/api/admin/backups');
        toast.success('Backup started');
        refreshBackups();
    };
    
    const handleRestore = async (backupId) => {
        const confirmed = window.confirm(
            'WARNING: This will replace current data with backup. Continue?'
        );
        if (!confirmed) return;
        
        setIsRestoring(true);
        try {
            await api.post(`/api/admin/backups/${backupId}/restore`);
            toast.success('Database restored successfully');
        } catch (error) {
            toast.error('Restore failed');
        } finally {
            setIsRestoring(false);
        }
    };
    
    return (
        <div className="backup-dashboard">
            <h2>Database Backup Management</h2>
            
            <Button onClick={handleManualBackup} variant="primary">
                Create Manual Backup
            </Button>
            
            <Table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {backups.map(backup => (
                        <tr key={backup.id}>
                            <td>{formatDate(backup.created_at)}</td>
                            <td>{formatSize(backup.size)}</td>
                            <td>{backup.type}</td>
                            <td>
                                <Button 
                                    onClick={() => handleRestore(backup.id)}
                                    disabled={isRestoring}
                                    variant="warning"
                                >
                                    Restore
                                </Button>
                                <a 
                                    href={`/api/admin/backups/${backup.id}/download`}
                                    download
                                >
                                    Download
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
}
```

#### Multi-Boarding House UI
```jsx
function BoardingHouseSelector({ ownerId, selectedBhId, onChange }) {
    const [boardingHouses, setBoardingHouses] = useState([]);
    
    useEffect(() => {
        api.get(`/api/owners/${ownerId}/boarding-houses`).then(res => {
            setBoardingHouses(res.data);
        });
    }, [ownerId]);
    
    return (
        <Select
            label="Select Boarding House"
            value={selectedBhId}
            onChange={(e) => onChange(e.target.value)}
        >
            {boardingHouses.map(bh => (
                <option key={bh.id} value={bh.id}>
                    {bh.name} ({bh.location})
                </option>
            ))}
        </Select>
    );
}
```

---

## Summary: API Endpoints Reference

### Authentication & Users
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register new account (sets status to pending) |
| `/api/auth/login` | POST | Public | Login (checks approval status) |
| `/api/users/me` | GET | Any | Get current user profile |
| `/api/users/me` | PUT | Any | Update profile |
| `/api/users/upload-avatar` | POST | Any | Upload profile picture |

### Admin
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/pending-accounts` | GET | Admin | List pending approvals |
| `/api/admin/approve-account` | POST | Admin | Approve user |
| `/api/admin/reject-account` | POST | Admin | Reject user |
| `/api/admin/backups` | GET | Admin | List backups |
| `/api/admin/backups` | POST | Admin | Create backup |
| `/api/admin/backups/:id/restore` | POST | Admin | Restore backup |

### Boarding Houses & Rooms
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/boarding-houses` | GET | Any | List all BH |
| `/api/boarding-houses/:id` | GET | Any | Get BH details |
| `/api/boarding-houses/:id/rooms` | GET | Any | List rooms in BH |
| `/api/rooms` | POST | Owner | Create room |
| `/api/rooms/:id` | GET | Any | Get room details |
| `/api/rooms/:id` | PUT | Owner | Update room |
| `/api/rooms/:id` | DELETE | Owner/Admin | Delete room |
| `/api/rooms/:id/assign-student` | POST | Owner | Assign student |

### Reservations
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/reservations` | POST | Student | Create reservation |
| `/api/reservations` | GET | Any | List my reservations |
| `/api/reservations/pending` | GET | Owner | List pending for my BH |
| `/api/reservations/:id/approve` | POST | Owner | Approve reservation |
| `/api/reservations/:id/reject` | POST | Owner | Reject reservation |

### Public (No Auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/boarding-houses` | GET | List BH for map |
| `/api/public/boarding-houses/:id` | GET | Public BH details |

---

## Testing Checklist

### Unit Tests
- [ ] Room status calculation logic
- [ ] Capacity validation
- [ ] Image upload validation
- [ ] Reservation auto-fill logic

### Integration Tests
- [ ] Full reservation workflow
- [ ] Account approval workflow
- [ ] Student assignment to room
- [ ] Backup and restore

### E2E Tests
- [ ] Complete user registration to approval flow
- [ ] Student finds BH → reserves → owner approves → student moves in
- [ ] Admin backup and restore operations

---

*Implementation Plan generated: April 16, 2026*
*Total Estimated Duration: 6 weeks*
*Recommended Team: 2 developers (1 frontend, 1 backend)*
