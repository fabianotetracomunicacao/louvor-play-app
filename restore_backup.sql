-- RESTORE DATA SCRIPT
-- Generated automatically

DO $$
DECLARE
    new_owner_id uuid;
BEGIN
    SELECT id INTO new_owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

    IF new_owner_id IS NULL THEN
        RAISE EXCEPTION 'No user found to assign data to!';
    END IF;

    -- Restoring 4 Songs
    INSERT INTO public.songs (id, title, artist, content, original_key, font_size, line_spacing, created_by, created_at, updated_at) VALUES (
        'bdd866b0-db3c-46c9-b988-05c298cb4de1',
        'Ainda que a figueira',
        'Fernandinho',
        '
[Intro] [Em]  [G]  [D9]
        [Em]  [G]  [D9]


 [Em]  Tu és a minha[D9] porção
 [Am7]   Tu és a m[C]inha herança
 [Em]  Tu és o me[D9]u socorro
Nos di[Am7]as de tribulaç[C]ão

[G]  Mesmo que meus pa[D9]is me deixem
 [Am7]   Mesmo que am[C]igos me traiam
[G]  Eu sei que em Seus bra[D9]ços
Eu enco[Am7]ntro salvaç[C]ão


*A[G]inda que a figueira 
Nã[D9]o floresça
Ai[Am7]nda que a videira 
Não d[C]ê o seu fruto
M[G]esmo que não haja alime[D9]nto 

Nos campos
Eu me al[F]egrarei em T[C]i


A[G]inda que a figueira 
Nã[D9]o floresça
Ai[Am7]nda que a videira 
Não d[C]ê o seu fruto
M[G]esmo que não haja alime[D9]nto 

Nos campos
Eu me al[F]egrarei em T[C]i*


[ Em  G  D9   Em  G  D9 ]


 [Em]  Tu és a minha[D9] porção
 [Am7]   Tu és a m[C]inha herança
 [Em]  Tu és o me[D9]u socorro
Nos di[Am7]as de tribulaç[C]ão

[G]  Mesmo que meus pa[D9]is me deixem
 [Am7]   Mesmo que am[C]igos me traiam
[G]  Eu sei que em Seus bra[D9]ços
Eu enco[Am7]ntro salvaç[C]ão


*A[G]inda que a figueira 
Nã[D9]o floresça
Ai[Am7]nda que a videira 
Não d[C]ê o seu fruto
M[G]esmo que não haja alime[D9]nto 

Nos campos
Eu me al[F]egrarei em T[C]i


A[G]inda que a figueira 
Nã[D9]o floresça
Ai[Am7]nda que a videira 
Não d[C]ê o seu fruto
M[G]esmo que não haja alime[D9]nto 

Nos campos
Eu me al[F]egrarei em T[C]i*


[Solo:] [Am7]  [G]  [D9]
        [Am7]  [G]  [D9]
        [Am7]  [G]  [D9]
        [Am7]  [G]  [D9]  [C]

{sot}
[Parte 1 de 4 - 2x:]   [Am7]  [G]  [D9]
E|------------------------------------------|
B|------------------------------------------|
G|----2-2-----2-----2-2h4-2-----2--2-2-1-1-1|
D|2h4-----2h4---2h4---------2h4-------------|
A|------------------------------------------|
E|------------------------------------------|

[Parte 2 de 4:]   [Am7]  [G]  [D9]
E|------------------------------------------|
B|----10-12b14-b14r12-10-9------------------|
G|-11----------------------9-9h11-----------|
D|------------------------------------------|
A|------------------------------------------|
E|------------------------------------------|


[Parte 3 de 4:]   [Am7]  [G]  [D9]
E|-------------14---------------------------|
B|----10-12b14----10-9----------------------|
G|-11------------------9-9h11---------------|
D|------------------------------------------|
A|------------------------------------------|
E|------------------------------------------|

[Parte 4 de 4:]   [Am7]  [G]  [D9]  [C]
E|-------------9-9----9-12-12---------------|
B|-10----10-10-----10---------10------------|
G|----11------------------------------------|
D|------------------------------------------|
A|------------------------------------------|
E|------------------------------------------|
{eot}

A[G]inda que a figueira 
Nã[D9]o floresça
Ai[Am7]nda que a videira 
Não d[C]ê o seu fruto
M[G]esmo que não haja alime[D9]nto 

Nos campos
Eu me al[F]egrarei em T[C]i

A[G]inda que a figueira 
Nã[D9]o floresça
Ai[Am7]nda que a videira 
Não d[C]ê o seu fruto
M[G]esmo que não haja alime[D9]nto 

Nos campos
Eu me al[F]egrarei em T[C]i  [G]',
        'Em',
        12,
        0.8,
        new_owner_id,
        '2025-12-15T22:18:57.208152+00:00',
        '2025-12-19T22:47:29.272+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.songs (id, title, artist, content, original_key, font_size, line_spacing, created_by, created_at, updated_at) VALUES (
        '00070af1-097f-4986-bc1a-a54ee63a6e7c',
        'Tu és/Águas Purificadoras',
        'FHOP',
        '[Intro] [Bm7]  [A/C#]  [G2]


{sot}
[TAB - Intro]
[Bm7] [A/C#] [G2]
E|-------0------0---------|
B|-3--3---------3---------|
G|-2--2--2--2---2---------|
D|--------------0---------|
A|-2-----4----------------|
E|--------------3---------|
{eot}

* [Bm7]   Junto ao poço estav[A/C#]a eu
Qu[G2]ando um homem judeu
Viu a se[Bm7]de que havia[A/C#] em mim  [G2]
 [Bm7]   Sem me ouvir  
Con[A/C#]heceu e[G2] me ofereceu
Uma á[Bm7]gua que jor[A/C#]ra sem fim  [G2]*


{sot}
[Tab - Primeira parte]

Parte 1 de 2  
   [Bm7] [A/C#] [G2] [Bm7] [A/C#] [G2]
E|-----------0--------------0---------------|
B|-3---------3----3---------3---------------|
G|-2----2----2----2----2----2---------------|
D|-----------0--------------0---------------|
A|-2----4---------2----4--------------------|
E|-----------3--------------3---------------|

Parte 2 de 2
E|------------------------------------------|
B|-3--3---------3----3---------3------------|
G|-2--2--2--2---2----2----2----2------------|
D|--------------0--------------0------------|
A|-2-----4-----------2----4-----------------|
E|--------------3--------------3------------|
{eot}


Dá[Em7]-me de beber pois tenho sed[D/F#]e
Não quero mais bu[G2]scar em outras 
Fontes   [D/F#]
Nã[Em7]o precisarei aqui voltar[D/F#] 
Pra minha sede sacia[G2]r 
Uma vez que eu já ouv[A]i teu falar


{sot}
[Tab - Pré-refrão]

Parte 1 de 3
  [Em7] [D/F#] [G2] [D/F#]
E|------------------------------------------|
B|-------3----------3----3---3--3--3--3-----|
G|-----0----------2------2---2--2--2--2-----|
D|---2----------0--------0---0--0--0--0-----|
A|------------------------------------------|
E|-0----------2----------3---2--------------|

Parte 2 de 3
 [Em7 [D/F#] [G2]
E|------------------------------------------|
B|-3--3--3--3--3--3--3--3--3--3--3--3-------|
G|-0--0--0--0--2--2--2--2--2--2--2--2-------|
D|-2--2--2--2--0--0--0--0--0--0--0--0-------|
A|------------------------------------------|
E|-0-----------2-----------3----------------|

Parte 3 de 3
   [A]
E|-2---3---2---0----------------------------|
B|------------------------------------------|
G|-2---4---2---0----------------------------|
D|------------------------------------------|
A|-0----------------------------------------|
E|------------------------------------------|
{eot}



*Tu [D]és, por quem a minh''alma esper[G]ou
A fonte da vida que me[Em7] encontrou
                                     
És o Dom de Deus 
O Mess[G]ias, o meu S[A]alvador*

[Tab - frase do A]


{sot}
   [A]
E|-3---2---0--------------------------------|
B|------------------------------------------|
G|-4---2---2--------------------------------|
D|------------------------------------------|
A|---0--------------------------------------|
E|------------------------------------------|
{eot}


[ Bm7  A/C#  G  Em7 
 Bm7  A/C#  G ]

[Primeira Parte]

 [Bm7]   Junto ao poço est[A/C#]ava eu
Qu[G2]ando um homem judeu  [Em7]
Viu a se[Bm7]de que havia[A/C#] em mim  [G2]
 [Bm7]   Sem me ouvir  
Con[A/C#]heceu e[G2] me ofereceu[Em7]
Uma á[Bm7]gua que jor[A/C#]ra sem fim  [G2]

Dá[Em7]-me de beber pois tenho sed[D/F#]e
Não quero mais busc[G]ar em outras 
Fontes   [D/F#]
Nã[Em7]o precisarei aqui voltar[D/F#] 
Pra minha  sede saci[G]ar
Uma vez que eu já ouv[A]i teu falar


*Tu [D]és, por quem a minh''alma esper[G]ou
A fonte da vida que me [Em7]encontrou                                     
És o Dom de Deus 
O Mess[G]ias, o meu S[A]alvador

Tu [D]és, por quem a minh''alma esper[G]ou
A fonte da vida que me [Em7]encontrou                                     
És o Dom de Deus 
O Mess[G]ias, o meu S[A]alvador*


Dá[Em7]-me de beber pois tenho sed[D/F#]e
Não quero mais busc[G]ar em outras 
Fontes   [D/F#]
Nã[Em7]o precisarei aqui voltar[D/F#] 
Pra minha  sede saci[G]ar
Uma vez que eu já ouvi [D/F#]teu falar

Dá[Em7]-me de beber pois tenho sed[D/F#]e
Não quero mais busc[G]ar em outras 
Fontes   [D/F#]
Nã[Em7]o precisarei aqui voltar[D/F#] 
Pra minha  sede saci[G]ar
Uma vez que eu já ouv[A]i teu falar


*Tu [D]és, por quem a minh''alma esper[G]ou
A fonte da vida que me [Em7]encontrou                                     
És o Dom de Deus 
O Mess[G]ias, o meu S[A]alvador

Tu [D]és, por quem a minh''alma esper[G]ou
A fonte da vida que me [Em7]encontrou                                     
És o Dom de Deus 
O Mess[G]ias, o meu S[A]alvador*

[Refrão - Águas Purificadoras]

Qu[D]ero beber do teu rio, Senhor   [D/F#]
Sac[G]ia minha sed[D/F#]e, lava o me[Em7]u interi[A]or
Eu que[Bm7]ro fluir em tuas [G]águas [A]
Eu que[Bm7]ro beber da tua f[G]onte
Fonte de águas v[A]ivas

Qu[D]ero beber do teu rio, Senhor   [D/F#]
Sac[G]ia minha sed[D/F#]e, lava o me[Em7]u interi[A]or
Eu que[Bm7]ro fluir em tuas [G]águas [A]
Eu que[Bm7]ro beber da tua f[G]onte
Fonte de águas v[A]ivas


*Tu [D]és, por quem a minh''alma esper[C]ou
A fonte da vida que me[G] encontrou                                 
És o Dom de Deus 
O Messia[Gm/Bb]s, o meu S[A]alvador

Tu [D]és, por quem a minh''alma espero[C]u
A fonte da vida que me[G] encontrou                                
És o Dom de Deus 
O Messia[Gm/Bb]s, o meu S[A]alvador

Tu [D]és, por quem a minh''alma esper[G]ou
A fonte da vida que me [Em7]encontrou                                    
És o Dom de Deus 
O Mess[G]ias, o meu S[A]alvador [D]*',
        'D',
        12,
        1,
        new_owner_id,
        '2025-12-18T15:54:06.234989+00:00',
        '2025-12-18T16:38:27.026+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.songs (id, title, artist, content, original_key, font_size, line_spacing, created_by, created_at, updated_at) VALUES (
        'ba034c08-ac88-421c-85b4-dbee8737ea91',
        'Oceano',
        'Ana Nóbrega',
        '[Intro] [Bm]  [A/C#]  [D]  [A]  [G]
        [Bm]  [A/C#]  [D]  [A]  [G]

[Primeira Parte]

 [Bm]  Tua voz me chama sob[A/C#]re as [D]águas
Onde os m[A]eus pés podem f[G]alhar
 [Bm]  E ali Te encontro no [A/C#]mist[D]ério
Em meio [A]ao mar, confi[G]arei

[Refrão]

[G]  Ao Teu n[D]ome clam[A]arei
[G]  E além das [D]ondas olh[A]arei
Se o mar cresc[G]er somente em T[D]i descans[A]arei
Pois eu sou T[G]eu e T[A]u  é[Bm]s meu

( A/C#  D  A  G )

[Segunda Parte]

 [Bm]  Tua graça cobre os meu[A/C#]s tem[D]ores
Tua fort[A]e mão me gui[G]ará
 [Bm]  Se estou cercado pel[A/C#]o  m[D]edo
Página 1 / 4
Tu és f[A]iel, nunca vais f[G]alhar

[Refrão]

[G]  Ao Teu n[D]ome clam[A]arei
[G]  E além das [D]ondas olh[A]arei
Se o mar cresc[G]er somente em T[D]i descans[A]arei
Pois eu sou T[G]eu e T[A]u  é[Bm]s meu

( A/C#  D  A  G )
( Bm  A/C#  D  A  G )
( Bm  G  D  A )
( Bm  G  D  A )

[Ponte]

 [Bm]  Guia-me para que em t[G]udo em Ti confie
Sobre as [D]águas eu caminhe
Por [A]onde quer que chames
 [Bm]  Leva-me mais fundo d[G]o que já estive
E minha f[D]é será mais firme
Senh[A]or, em Tua presença

 [Bm]  Guia-me para que em t[G]udo em Ti confie
Sobre as [D]águas eu caminhe
Por [A]onde quer que chames
 [Bm]  Leva-me mais fundo d[G]o que já estive
E minha f[D]é será mais firme
Página 2 / 4
Senh[A]or, em Tua presença

 [Bm]  Guia-me para que em t[G]udo em Ti confie
Sobre as [D]águas eu caminhe
Por [A]onde quer que chames
 [Bm]  Leva-me mais fundo d[G]o que já estive
E minha f[D]é será mais firme
Senh[A]or, em Tua presença

[G]  Guia-me para que em t[D]udo em Ti confie
Sobre as [A]águas eu caminhe
Por on[Em]de quer que chames
[G]  Leva-me mais fundo d[D]o que já estive
E minha f[A]é será mais firme
Senho[Em]r, em Tua presença

 [Bm7]   Guia-me par[A/C#]a que em t[D]udo em Ti confie
Sobre as [A]águas eu caminhe
Por on[Em]de quer que chames
 [Bm7]   Leva-me mais fun[A/C#]do d[D]o que já estive
E minha f[A]é será mais firme
Senho[Em]r, em Tua presença

 [Bm7]   Guia-me par[A/C#]a que em t[D]udo em Ti confie
Página 3 / 4
Sobre as [A]águas eu caminhe
Por on[Em]de quer que chames
 [Bm7]   Leva-me mais fun[A/C#]do d[D]o que já estive
E minha f[A]é será mais firme
Senho[Em]r, em Tua presença

( Bm  A  D  A  Em )
( Bm  A  D  A  Em )

[Refrão]

[G]  Ao Teu n[D]ome clam[A]arei
[G]  E além das [D]ondas olh[A]arei
[G]  Somente em T[D]i descans[A]arei
Pois eu sou T[G]eu e T[A]u  é[Bm]s meu

[Final] [A]  [D]  [A]  [G]
        [Bm]  [A]  [D]  [A]  [G]',
        'C',
        12,
        1,
        new_owner_id,
        '2025-12-18T16:18:53.671726+00:00',
        '2025-12-18T16:18:54.851+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.songs (id, title, artist, content, original_key, font_size, line_spacing, created_by, created_at, updated_at) VALUES (
        'd4517dad-624f-41fc-95c2-b30efd81aa27',
        'Eu Navegarei',
        'Harpa Cristã',
        '[INTRODUÇÃO:]  [Am7]  [G6]  [F7M]
                            [Dm7(9)]  [E]  [E4]  [E]

Eu navegare[Am7]i
No oceano do Espí[G6]rito
E ali adorare[F7M]i    [Dm7]
Ao Deus do meu am[E]or  [E4]   [E]

Eu adorare[Am7]i
Ao Deus da minha vi[G6]da
Que me compreende[F7M]u    [Dm7]
Sem nenhuma explicaç[E]ão  [E4]   [E]


*Espírito, Espí[Am7]rito
Que desce como fo[G6]go
Vem como em penteco[F7M]stes  [Dm7]
E enche-me de n[E]ovo [E4]   [E]

Espírito, Espí[Am7]rito
Que desce como fo[G6]go
Vem como em penteco[F7M]stes  [Dm7]
E enche-me de n[E]ovo [E4]   [E]*

Eu navegare[Am7]i
No oceano do Espí[G6]rito
E ali adorarei [F7M(9)]      [Dm7]
Ao Deus do meu am[E]or  [E4]   [E]

Eu adorare[Am7]i
Ao Deus da minha vi[G6]da
Que me compreendeu [F7M(9)]      [Dm7]
Sem nenhuma explicaç[E]ão  [E4]   [E]

*Espírito, Espí[Am7]rito
Que desce como fo[G6]go
Vem como em pentecost[F7M(9)]es    [Dm7]
E enche-me de n[E]ovo [E4]   [E]

Espírito, Espí[Am7]rito
Que desce como fo[G6]go
Vem como em pentecost[F7M(9)]es    [Dm7]
E enche-me de n[E]ovo [E4]   [E]*

[Solo:] [Am7]  [G6]  [F7M] 
           [Dm7]  [E]  [E4]  [E] 
           [Am7]  [G6]  [F7M] 
           [Dm7]  [E]  [E4]  [E] ',
        'Am',
        12,
        1,
        new_owner_id,
        '2025-12-15T20:45:05.146498+00:00',
        '2025-12-18T01:50:21.586+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    -- Restoring 2 Playlists
    INSERT INTO public.playlists (id, name, is_public, owner_id, created_at, updated_at) VALUES (
        '57ea09f6-ab9d-4e07-96c0-7e7f0b676a49',
        'Teste de playlist publica',
        true,
        new_owner_id,
        '2025-12-18T18:57:52.378055+00:00',
        '2025-12-18T18:57:53.101+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.playlists (id, name, is_public, owner_id, created_at, updated_at) VALUES (
        '25f3b85e-6f15-4e40-b049-463eb1ecd447',
        'Playlist de usuário Musico',
        true,
        new_owner_id,
        '2025-12-19T22:49:58.399636+00:00',
        '2025-12-19T22:49:57.497+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    -- Restoring 4 Playlist Items
    INSERT INTO public.playlist_items (id, playlist_id, song_id, custom_transposition, position, created_at) VALUES (
        'b8d299f8-e487-4c5a-901e-3f8cf92ba58f',
        '25f3b85e-6f15-4e40-b049-463eb1ecd447',
        'bdd866b0-db3c-46c9-b988-05c298cb4de1',
        0,
        0,
        '2025-12-19T22:50:14.135903+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.playlist_items (id, playlist_id, song_id, custom_transposition, position, created_at) VALUES (
        '87e56d09-2af0-4d97-a9f4-4a8d18f47d0f',
        '25f3b85e-6f15-4e40-b049-463eb1ecd447',
        'd4517dad-624f-41fc-95c2-b30efd81aa27',
        0,
        0,
        '2025-12-19T22:50:14.466194+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.playlist_items (id, playlist_id, song_id, custom_transposition, position, created_at) VALUES (
        'c51625ee-6559-49d4-a713-615a3d9edc0f',
        '25f3b85e-6f15-4e40-b049-463eb1ecd447',
        '00070af1-097f-4986-bc1a-a54ee63a6e7c',
        0,
        3,
        '2025-12-19T22:55:06.778964+00:00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.playlist_items (id, playlist_id, song_id, custom_transposition, position, created_at) VALUES (
        '8c5ead44-3c76-4c35-b6e4-958e22e9fbb6',
        '25f3b85e-6f15-4e40-b049-463eb1ecd447',
        'ba034c08-ac88-421c-85b4-dbee8737ea91',
        0,
        3,
        '2025-12-19T22:56:44.237377+00:00'
    ) ON CONFLICT (id) DO NOTHING;

END $$;
