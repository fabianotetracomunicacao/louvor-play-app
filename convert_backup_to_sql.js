import fs from 'fs';

function escapeLiteral(str) {
    if (str === null || str === undefined) return 'NULL';
    // Replace single quote with two single quotes
    return "'" + String(str).replace(/'/g, "''") + "'";
}

function generateRestoreSQL() {
    console.log('📦 Converting JSON backups to SQL...');

    let sql = `-- RESTORE DATA SCRIPT\n`;
    sql += `-- Generated automatically\n\n`;
    sql += `DO $$\nDECLARE\n    new_owner_id uuid;\nBEGIN\n`;
    // Get the first user (assuming it's the admin created)
    sql += `    SELECT id INTO new_owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1;\n\n`;
    sql += `    IF new_owner_id IS NULL THEN\n`;
    sql += `        RAISE EXCEPTION 'No user found to assign data to!';\n`;
    sql += `    END IF;\n\n`;

    // 1. Songs
    if (fs.existsSync('backup_songs_data.json')) {
        const songs = JSON.parse(fs.readFileSync('backup_songs_data.json', 'utf8'));
        sql += `    -- Restoring ${songs.length} Songs\n`;
        songs.forEach(song => {
            sql += `    INSERT INTO public.songs (id, title, artist, content, original_key, font_size, line_spacing, created_by, created_at, updated_at) VALUES (\n`;
            sql += `        ${escapeLiteral(song.id)},\n`;
            sql += `        ${escapeLiteral(song.title)},\n`;
            sql += `        ${escapeLiteral(song.artist)},\n`;
            sql += `        ${escapeLiteral(song.content)},\n`;
            sql += `        ${escapeLiteral(song.original_key)},\n`;
            sql += `        ${song.font_size || 12},\n`;
            sql += `        ${song.line_spacing || 1.0},\n`;
            sql += `        new_owner_id,\n`; // Use variable
            sql += `        ${escapeLiteral(song.created_at)},\n`;
            sql += `        ${escapeLiteral(song.updated_at)}\n`;
            sql += `    ) ON CONFLICT (id) DO NOTHING;\n\n`;
        });
    }

    // 2. Playlists
    if (fs.existsSync('backup_playlists_data.json')) {
        const playlists = JSON.parse(fs.readFileSync('backup_playlists_data.json', 'utf8'));
        sql += `    -- Restoring ${playlists.length} Playlists\n`;
        playlists.forEach(pl => {
            sql += `    INSERT INTO public.playlists (id, name, is_public, owner_id, created_at, updated_at) VALUES (\n`;
            sql += `        ${escapeLiteral(pl.id)},\n`;
            sql += `        ${escapeLiteral(pl.name)},\n`;
            sql += `        ${pl.is_public || false},\n`;
            sql += `        new_owner_id,\n`; // Use variable
            sql += `        ${escapeLiteral(pl.created_at)},\n`;
            sql += `        ${escapeLiteral(pl.updated_at)}\n`;
            sql += `    ) ON CONFLICT (id) DO NOTHING;\n\n`;
        });
    }

    // 3. Playlist Items
    if (fs.existsSync('backup_playlist_items_data.json')) {
        const items = JSON.parse(fs.readFileSync('backup_playlist_items_data.json', 'utf8'));
        sql += `    -- Restoring ${items.length} Playlist Items\n`;
        items.forEach(item => {
            sql += `    INSERT INTO public.playlist_items (id, playlist_id, song_id, custom_transposition, position, created_at) VALUES (\n`;
            sql += `        ${escapeLiteral(item.id)},\n`;
            sql += `        ${escapeLiteral(item.playlist_id)},\n`;
            sql += `        ${escapeLiteral(item.song_id)},\n`;
            sql += `        ${item.custom_transposition || 0},\n`;
            sql += `        ${item.position || 0},\n`;
            sql += `        ${escapeLiteral(item.created_at)}\n`;
            sql += `    ) ON CONFLICT (id) DO NOTHING;\n\n`;
        });
    }

    sql += `END $$;\n`;

    fs.writeFileSync('restore_backup.sql', sql);
    console.log('✅ restore_backup.sql created successfully!');
}

generateRestoreSQL();
