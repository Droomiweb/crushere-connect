-- Fixed Migration to update Admin Credentials
-- New Email: crushere.in@gmail.com
-- New Password: crushere@2005

DO $$
DECLARE
  target_email text := 'crushere.in@gmail.com';
  old_email text := 'crush.in@gmail.com';
  new_password text := 'crushere@2005';
  target_user_id uuid;
  old_user_id uuid;
BEGIN
  -- 1. Check if the TARGET user already exists
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NOT NULL THEN
    -- Target user already exists. We just need to update its password and ensure admin rights.
    
    -- Update password
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = target_user_id;

    -- Ensure profile exists (idempotent upsert)
    INSERT INTO public.profiles (id, email, full_name, is_verified, verification_status)
    VALUES (target_user_id, target_email, 'Admin User', true, 'verified')
    ON CONFLICT (id) DO UPDATE SET
      email = excluded.email,
      is_verified = true,
      verification_status = 'verified';

    -- Ensure admin role
    INSERT INTO public.admins (id, role)
    VALUES (target_user_id, 'superadmin')
    ON CONFLICT (id) DO NOTHING;

    -- Optional: We could delete the old user if it exists to avoid confusion, 
    -- but usually safer to leave it or let manual cleanup happen. 
    -- For now, we mainly ensured the NEW credentials work.

  ELSE
    -- Target user does NOT exist.
    -- Check if the OLD user exists to rename it.
    SELECT id INTO old_user_id FROM auth.users WHERE email = old_email;

    IF old_user_id IS NOT NULL THEN
      -- Rename old user to new email
      UPDATE auth.users 
      SET 
        email = target_email,
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
      WHERE id = old_user_id;

      -- Update profile email
      UPDATE public.profiles
      SET email = target_email
      WHERE id = old_user_id;
      
      -- Ensure admin role (just in case)
      INSERT INTO public.admins (id, role)
      VALUES (old_user_id, 'superadmin')
      ON CONFLICT (id) DO NOTHING;

    ELSE
      -- Neither exists. Create brand new user.
      target_user_id := gen_random_uuid();
      
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
      ) VALUES (
        target_user_id, '00000000-0000-0000-0000-000000000000', target_email, 
        crypt(new_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}',
        now(), now(), 'authenticated'
      );

      INSERT INTO public.profiles (id, email, full_name, is_verified, verification_status)
      VALUES (target_user_id, target_email, 'Admin User', true, 'verified');

      INSERT INTO public.admins (id, role)
      VALUES (target_user_id, 'superadmin');
    END IF;
  END IF;
END $$;
