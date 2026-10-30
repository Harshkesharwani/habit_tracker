# Acceptance Criteria

## Habit lifecycle
- A user can create a habit with valid required fields.
- Invalid input receives a useful error.
- A user can view, edit, delete, and archive their own habits.
- Changing an ID cannot expose or modify another user's habit.
- Archived habits are excluded from the active list and remain available in history.

## Completion tracking
- A habit can be completed for a date and the completion can be undone.
- The same habit/date pair cannot produce duplicate records.
- Calendar history reflects saved completion records.
- Editing habit details does not erase historical completions.

## Statistics
- Statistics change when completion records change.
- The selected period is clear.
- Completion-rate denominator is documented and consistent.

## Authentication and quality
- Invalid credentials do not authenticate the user.
- Private endpoints require authentication in backend/full-stack tracks.
- Passwords are never stored in plain text.
- Logout clears or invalidates the applicable session.
- Tests cover important business rules.
- Setup instructions work from a clean checkout.
- No real secrets or personal data are committed.
