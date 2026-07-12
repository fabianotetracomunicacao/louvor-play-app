-- Verifica as preferências salvas para todos os usuários (ou adicione WHERE user_id = 'seu-id')
SELECT 
    user_id,
    mobile_font_size, 
    desktop_font_size, 
    mobile_letter_spacing, 
    desktop_letter_spacing,
    default_font_size, -- legado
    updated_at
FROM user_preferences;
