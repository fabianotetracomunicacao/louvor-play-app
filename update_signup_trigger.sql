-- Update the handle_new_user function to map metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role,
    full_name,
    phone,
    church,
    favorite_style,
    city,
    birth_date
  )
  VALUES (
    new.id, 
    new.email, 
    'musician', -- Default role
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'church',
    new.raw_user_meta_data->>'favorite_style',
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->>'birth_date')::date
  );
  RETURN new;
END;
$function$;
