# Boarding House System Fix Requirements Structure

## Purpose

This document restructures the items from [PARTS NEEDED TO BE FIX.docx](/c:/Users/Sudo/Documents/BH-UPdate/docs/PARTS%20NEEDED%20TO%20BE%20FIX.docx) into a clean implementation checklist for the current Laravel + React project.

Use this as the main tracking document for fixes. Each requirement includes:

- `Requirement ID`
- `Problem / requested change`
- `Scope`
- `Owner`
- `Acceptance criteria`
- `Notes / dependencies`

---

## Recommended Workflow

1. Confirm the requirement wording with the client or adviser if the item is ambiguous.
2. Check whether the backend, frontend, database, and email flow are affected.
3. Implement the fix behind one requirement ID at a time.
4. Test the requirement using the acceptance criteria in this document.
5. Mark the requirement status as `Done`, `Partial`, `Blocked`, or `Not Included`.

---

## Status Legend

| Status | Meaning |
|---|---|
| `Todo` | Not started |
| `In Progress` | Currently being implemented |
| `Done` | Implemented and tested |
| `Blocked` | Cannot proceed because of dependency or missing decision |
| `Not Included` | Explicitly not to be implemented |

---

## Requirements Tracker

| ID | Requirement | Scope | Owner | Priority | Status |
|---|---|---|---|---|---|
| `R1` | Clickable room availability filters: `Available`, `Limited`, `Full` | Frontend, Backend | FE + BE | High | `Todo` |
| `R2` | Default map view should use satellite mode | Frontend | FE | Medium | `Todo` |
| `R3` | Replace or remove unclear UI text/section from item 2 in source doc | Frontend | FE | Medium | `Blocked` |
| `R4` | Admin approval/rejection for Student and BH Owner accounts with Gmail notification | Backend, Frontend, Email | FE + BE | High | `Todo` |
| `R5` | Student and owner profile photo upload | Frontend, Backend, Storage | FE + BE | High | `Todo` |
| `R6` | Student must not be able to change Student ID after creation | Frontend, Backend | FE + BE | High | `Todo` |
| `R7` | Student must be assigned to both room and boarding house; prevent assignment if room is full | Backend, Frontend, DB | FE + BE | High | `Todo` |
| `R8` | Change `Send Inquiry` flow to `Reservation` flow with auto-filled account data | Frontend, Backend | FE + BE | High | `Todo` |
| `R9` | Student reservation form should only show move-in date, year level, and message | Frontend, Backend | FE + BE | High | `Todo` |
| `R10` | Remove preferred room option from reservation | Frontend, Backend | FE + BE | High | `Todo` |
| `R11` | Remove budget option from reservation | Frontend, Backend | FE + BE | High | `Todo` |
| `R12` | Student account must include address visible to BH owner during reservation | Frontend, Backend, DB | FE + BE | High | `Todo` |
| `R13` | Students page should have `Manual Add` and `Direct Add` options | Frontend, Backend | FE + BE | Medium | `Todo` |
| `R14` | `Direct Add` should convert approved reservations into student records | Backend, Frontend | FE + BE | High | `Todo` |
| `R15` | Owner must upload exactly or at least 3 room photos when adding a room | Frontend, Backend, Storage | FE + BE | High | `Todo` |
| `R16` | Remove redundant BH field from owner-side student view, but keep it for admin | Frontend | FE | Medium | `Todo` |
| `R17` | Admin can only view and delete rooms; admin cannot add or edit rooms | Frontend, Backend | FE + BE | High | `Todo` |
| `R18` | Room page must include `Add Student` action | Frontend, Backend | FE + BE | High | `Todo` |
| `R19` | Room availability should auto-detect based on occupancy | Backend, Frontend | FE + BE | High | `Todo` |
| `R20` | Prevent adding students beyond room slot capacity | Backend, Frontend, DB | FE + BE | High | `Todo` |
| `R21` | Backup and restore database | Backend, Admin | BE | Medium | `Todo` |
| `R22` | Public users can view boarding houses on the map without logging in | Frontend, Backend | FE + BE | High | `Todo` |
| `R23` | Public users must sign in or register before reserving | Frontend, Backend | FE + BE | High | `Todo` |
| `R24` | Admin viewing stored passwords and sending passwords by email/phone | Security | BE | High | `Not Included` |
| `R25` | Default map location should be `SKSU Kalamansig Campus` | Frontend | FE | Medium | `Todo` |

---

## Detailed Requirements

### `R1` Room Availability Filters

**Problem / requested change**

Users should be able to click `Available`, `Limited`, and `Full` to filter rooms.

**Scope**

- Frontend filter buttons
- Backend room status source if not already computed

**Acceptance criteria**

- Clicking `Available` only shows rooms with `0` occupants.
- Clicking `Limited` only shows rooms with occupants below full capacity.
- Clicking `Full` only shows rooms at full capacity.
- Filter state updates without page breakage.

**Notes / dependencies**

- Depends on `R19` and `R20` if status is occupancy-based.

### `R2` Default Map = Satellite

**Problem / requested change**

The default map layer should open in satellite mode.

**Acceptance criteria**

- Map first loads in satellite view.
- Map controls still work normally.

### `R3` Replace or Remove Unclear Item 2

**Problem / requested change**

The source document says `remove this or change this`, but it does not identify the exact UI element.

**Acceptance criteria**

- Exact target screen and component are identified before implementation.

**Notes / dependencies**

- This requirement is blocked until the exact screen element is confirmed.

### `R4` Account Approval / Rejection with Email

**Problem / requested change**

Admin must be able to approve or reject Student and BH Owner accounts. Approved accounts should receive email notification through Gmail.

**Acceptance criteria**

- Admin sees pending Student and BH Owner accounts.
- Admin can approve or reject each account.
- Approval updates account status in database.
- Approval sends email notification to the account email address.
- Rejection behavior is clearly defined and tested.

**Notes / dependencies**

- Requires working mail configuration.

### `R5` Profile Photo Upload

**Problem / requested change**

Student and BH Owner accounts should support profile photo upload.

**Acceptance criteria**

- Student can upload profile photo.
- Owner can upload profile photo.
- Uploaded photo is stored and displayed correctly.
- Invalid file types are rejected.

### `R6` Lock Student ID

**Problem / requested change**

Student ID should not be editable after creation.

**Acceptance criteria**

- Student ID can be entered only during initial creation.
- Edit screen does not allow changing Student ID.
- Backend rejects Student ID modification requests.

### `R7` Assign Student to Room and Boarding House

**Problem / requested change**

Student must have an assigned room and assigned boarding house. Owners with multiple boarding houses must assign correctly. No assignment if room is full.

**Acceptance criteria**

- Student record stores assigned room.
- Student record stores assigned boarding house.
- Owner can choose from their own boarding houses.
- Assignment fails if selected room is already full.

### `R8` Convert Inquiry to Reservation

**Problem / requested change**

`Send Inquiry` should become `Reservation`.

**Acceptance criteria**

- UI text changes from inquiry language to reservation language.
- Reservation creates the correct backend record type.
- Owner sees reservation instead of inquiry in owner pages.

### `R9` Reservation Form Fields

**Problem / requested change**

Student should only enter preferred move-in date, year level, and message. Account information should be auto-detected.

**Acceptance criteria**

- Reservation form contains only:
- `Preferred move-in date`
- `Year level`
- `Message`
- Name, email, and other account details are auto-filled from logged-in user data.
- Owner sees the student account information in the reservation record.

### `R10` Remove Preferred Room Option

**Problem / requested change**

Preferred room should be removed because the student already selected a visible available room.

**Acceptance criteria**

- Reservation form no longer contains preferred room field.

### `R11` Remove Budget Option

**Problem / requested change**

Budget field should be removed because the room or boarding house price is already visible.

**Acceptance criteria**

- Reservation form no longer contains budget field.

### `R12` Student Address in Reservation

**Problem / requested change**

Student account should include address so the BH owner can see where the student is from during reservation review.

**Acceptance criteria**

- Student profile contains address field.
- Address is stored in database.
- Owner can view student address from reservation details.

### `R13` Students Page with Manual Add and Direct Add

**Problem / requested change**

Students module should have two options:

- `Manual Add`
- `Direct Add`

**Acceptance criteria**

- Students page clearly shows both actions.
- Each action opens the correct flow.

### `R14` Direct Add from Approved Reservations

**Problem / requested change**

`Direct Add` should be used for students whose reservations are already approved.

**Acceptance criteria**

- Approved reservation can be converted into student record.
- Reservation data is carried into student creation.
- Duplicate student creation is prevented.

### `R15` Minimum 3 Room Photos

**Problem / requested change**

When owner adds a room, the owner must upload 3 room photos.

**Acceptance criteria**

- Add-room form requires 3 photos before submission.
- Backend also validates minimum 3 photos.
- Room detail page displays uploaded photos.

### `R16` Remove Redundant Boarding House Field on Owner Side

**Problem / requested change**

The source document says a field should be removed because the BH is already known for the owner. Admin should still see the BH because admin needs to know where the student is assigned.

**Acceptance criteria**

- Owner-side screen no longer shows the redundant BH field.
- Admin-side screen still shows BH assignment.

**Notes / dependencies**

- Exact screen should be confirmed during implementation.

### `R17` Restrict Admin Room Permissions

**Problem / requested change**

Admin should not be able to add or edit rooms. Admin may only view and delete.

**Acceptance criteria**

- Admin UI hides add and edit room actions.
- Backend blocks admin create and update room requests.
- Admin can still view rooms and delete if allowed by policy.

### `R18` Room Action: Add Student

**Problem / requested change**

Room page should have an `Add Student` action.

**Acceptance criteria**

- Each eligible room shows `Add Student`.
- Action opens student assignment flow.

### `R19` Auto-Detect Room Availability

**Problem / requested change**

Room status should not be manually clicked as available or occupied. Status should be based on actual occupancy.

**Acceptance criteria**

- Empty room shows `Available`.
- Partially filled room shows `Limited`.
- Full room shows `Full`.
- Status updates automatically after student assignment or removal.

### `R20` Enforce Slot Capacity

**Problem / requested change**

Room should only accept as many students as its slot count allows.

**Acceptance criteria**

- If room capacity is `3`, only `3` students can be assigned.
- Additional assignment attempts are blocked.
- Occupancy count is visible in room UI.

### `R21` Backup and Restore Database

**Problem / requested change**

System should support database backup and restore.

**Acceptance criteria**

- Admin can generate a database backup.
- Admin can restore from a valid backup file.
- Backup and restore flow is documented and tested.

### `R22` Public Map Access

**Problem / requested change**

Public users should be able to view boarding houses on the map without logging in.

**Acceptance criteria**

- Map and boarding house markers load for guests.
- Guest users can open basic boarding house information.

### `R23` Reservation Requires Login

**Problem / requested change**

Guest users can browse, but they must create an account or sign in before reserving.

**Acceptance criteria**

- Guest users can see reserve button or call to action.
- Clicking reserve while logged out redirects to sign-in or registration.
- Reservation submission is blocked server-side for unauthenticated users.

### `R24` Admin Access to Saved Passwords

**Problem / requested change**

The source document suggests that admin should view saved passwords and send passwords directly.

**Decision**

This must **not** be implemented.

**Reason**

- Secure systems do not store readable passwords.
- Password reset should use secure reset flow, not password disclosure.
- This introduces a major security and privacy risk.

**Replacement requirement**

- Keep or improve secure password reset flow.
- If OTP is a problem, review the reset UX instead of exposing passwords.

### `R25` Default Map Location = SKSU Kalamansig Campus

**Problem / requested change**

The map should default to `SKSU Kalamansig Campus`.

**Acceptance criteria**

- Initial map center is set to SKSU Kalamansig Campus.
- Marker and search behavior still work after centering change.

---

## Implementation Order

### Phase 1: Core Data and Room Rules

- `R6` Lock Student ID
- `R7` Assign room and boarding house
- `R15` Minimum 3 room photos
- `R17` Restrict admin room permissions
- `R18` Add student action
- `R19` Auto-detect room availability
- `R20` Enforce slot capacity

### Phase 2: Reservation Flow

- `R8` Convert inquiry to reservation
- `R9` Reservation form fields
- `R10` Remove preferred room option
- `R11` Remove budget option
- `R12` Student address in reservation
- `R13` Manual add and direct add
- `R14` Direct add from approved reservations
- `R23` Reservation requires login

### Phase 3: Account and Access Flow

- `R4` Account approval and email
- `R5` Profile photo upload
- `R22` Public map access

### Phase 4: Map and Admin Utilities

- `R1` Room availability filters
- `R2` Satellite default map
- `R21` Backup and restore database
- `R25` Default map location

### Phase 5: Clarification Items

- `R3` Replace or remove unclear UI item
- `R16` Remove redundant owner-side BH field

---

## Testing Checklist

- Test guest browsing on map.
- Test guest reserve redirect.
- Test account approval and rejection flow.
- Test email sending from local and deployed environment.
- Test student profile creation and edit restrictions.
- Test reservation creation from logged-in student account.
- Test reservation approval to student conversion.
- Test owner room creation with 3 required images.
- Test room occupancy status changes after student assignment.
- Test over-capacity protection.
- Test admin permission restrictions.
- Test backup creation and restore flow.

---

## Open Questions to Confirm

1. What exact screen is referred to by item `2. remove this or change this`?
2. Which exact screen is referred to by the BH field removal request in item `8`?
3. Should room photo validation be `exactly 3` photos or `minimum 3` photos?
4. Should account rejection also send an email, or only approval?
5. Should `Direct Add` create a student automatically after reservation approval, or only prefill a creation form?

