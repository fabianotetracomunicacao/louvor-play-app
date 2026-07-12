-- Este script limpa as preferências visuais antigas (Legado) de TODAS as músicas.
-- Isso garante que não haja "lixo" antigo e que o sistema use apenas as novas colunas (Mobile/Desktop).

-- Mantemos 'transposition' e 'church_transposition' pois elas são globais e úteis.
-- Limpamos apenas tamanhos e espaçamentos.

UPDATE user_song_preferences
SET 
    font_size = NULL,
    line_spacing = NULL,
    scroll_speed = NULL,
    letter_spacing = NULL,
    display_mode = NULL; -- Opcional, se quiser resetar o modo de exibição também.

-- Após rodar isso, todas as músicas usarão o Padrão do Perfil até serem editadas novamente.
