

## Fix: Profile Role Escalation Vulnerability

### Problem
The "Users can update own profile" RLS policy has no `WITH CHECK` condition, allowing any user to change their own `role` to `coach`.

### Solution
Drop and recreate the policy with a `WITH CHECK` that prevents role changes:

**Migration SQL:**
```sql
DROP POLICY "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);
```

This ensures users can update their name, avatar, etc. but cannot change their `role` field.

### Files
| Action | File |
|--------|------|
| Migration | Add `WITH CHECK` to profiles UPDATE policy |

