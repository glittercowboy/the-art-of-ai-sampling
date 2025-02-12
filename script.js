document.addEventListener('DOMContentLoaded', () => {
    // Load and process tags once at startup
    const tags = "female vocalist, r&b, soulful, sexy, melancholic, bittersweet, lush, mellow, disco, west african, folk music, gentle, organic house, latin, regional music, acoustic, choir, traditional, indian classical music, studio 54, minimal, retro, tape, vintage, sampled, groovy, funky, percussive, chicago house, soulful house, spiritual, gospel, expressive, nostalgic, ambient, ethereal, lo-fi, tribal, cinematic, dreamy, orchestral, baroque, jazzy, smooth, eclectic, refined, blues, world music, afrobeat, downtempo, fusion, instrumental, experimental, romantic, celestial, urban, vocal harmony, psychedelic, electronic, lounge, brazilian, flamenco, afro-cuban, meditative, deep house, warm, analog, synthwave, renaissance, operatic, emotive, raw, subtle, chillwave, dub, island vibes, reggae, caribbean, bossa nova, bollywood, tango, samba, afro house, introspective, lo-fi beats, hypnotic, earthy, island soul, parisian, urban jazz, neosoul, deep bass, funky basslines, lush textures, spacious, atmospheric, spiritual jazz, piano jazz, melancholia, mystical, east african, deep soul, vocal chops, trance, upbeat, groovy rhythms, new age, slow groove, downtempo beats, soulful groove, latin jazz, field recordings, harp, vocal chants, trance-inducing, old school, soft funk, japanese jazz, flamenco guitar, sacred music, ritualistic, vocal samples, hip-hop soul, afro jazz, minimal house, raw drums, vocal echoes, balkan, ethio-jazz, dreamy vocals, cosmic, 80s retro, african rhythms, latin soul, funk soul, jungle jazz, cinematic strings, haunting, indigenous sounds, atmospheric house, samba soul, chill jazz, afro funk, relaxing beats, analog warmth, psychedelic soul, rhythmic, muted drums, heavy bass, soulful melodies, electric soul, deep groove, celestial vocals, spiritual groove, roots music, neo-jazz, new orleans jazz, brazilian soul, vintage synth, classical fusion, emotive vocals, soulful choir, upbeat funk, tribal percussion, spiritual rhythms, funky disco, samba rhythms, bolero, latin rhythms, percussion-driven, classic soul, lo-fi soul, smooth jazz, uplifting, deep grooves, gospel vocals, bossa grooves, bluesy, funky house, sunny vibes, traditional jazz, carnival rhythms, soulful harmonies, vibrant, lo-fi jazz, 90s retro, organic grooves, orchestral soul, soulful samples, folk-inspired, heartwarming, reggae dub, 70s groove, tribal house, percussive groove, desert vibes, island rhythm, mediterranean, big band, romantic jazz, chill soul, dub house, spiritual house, hazy, soulful expression, blues roots, neo-r&b, folk soul, blues rock, latin house, groovy soul, african house, indian rhythms, smooth funk, uplifting gospel, dusty, vocal texture, feel-good, soft melodies, organic rhythm, lush soundscape, deep r&b, afrobeats, tribal rhythms, soulful funk, jazz fusion, synth soul, cinematic jazz, folk ballads, ambient jazz, dark soul, cosmic soul, deep rhythm, retro soul, chill funk, african groove, melancholic groove, rich harmonies, spiritual gospel, mellow groove, folk blues, folk gospel, ethereal house, soulful vocals, rhythm & blues, emotive beats, jazzy soul, dreamy sound, silky smooth, 60s soul, airy, low-tempo, roots reggae, funk jazz, elegant, smokey, tropical, microhouse, glitch soul, footwork, vaporwave, chiptune, no wave, avant-folk, grime, kuduro, baile funk, skweee, future garage, drill, hard bop, zeuhl, freak folk, bluegrass, uk funky, cumbia, dembow, son cubano, rai, highlife, juke, soukous, makossa, kwaito, celtic folk, drone, freakbeat, boogie, jazz dance, jungle, zydeco, maloya, klezmer, maqam, tarab, fado, qawwali, huayno, gqom, mbira music, konnakol, bhangra, kuduro, schlager, schlager disco, romani brass, new jack swing, post-disco, digital dancehall, grimewave, liquid funk, maracatu, nu cumbia, vapor soul, experimental dub, sound system culture, dark jazz, witch house, desert rock, shoegaze, coldwave, skiffle, chain gang chants, swamp blues, zydeco funk, sevdalinka, ambient dub, kosmische, 2-step garage, ethereal trap, yé-yé, western swing, lap steel blues, cosmic disco, space rock, ethno-jazz, moombahton, chanson, gamelan, son jarocho, banda, narco corrido, psychobilly, progressive bluegrass, anti-folk, raga rock, flamenco nuevo, j-pop city pop, afro-swing, melodic techno, synth pop, dungeon synth, horrorcore, darkwave, italo house, norteño, ethio-funk, ghost folk, sacred steel, chain gang blues, afrofuturism, future beats, electroclash, indietronica, avant-funk, math rock, surf rock, swamp pop, pagan folk, zydeco blues, tropicália, jungle dub, cyberpunk electronica, celtic trance, horror synth, southern soul, cloud rap, vapor trap, nu jazz, gothic blues, noise rock, spaghetti western, vaporprog, abstract hip-hop, folktronica, street soul, horror jazz, sci-fi jazz, orchestral grime, g-funk, riot grrrl, medieval folk, americana noir, slacker rock, outlaw country, alt-country, gothabilly, tex-mex, mariachi fusion, cowpunk, doom blues, raga jazz, mutant disco, baile bass, voodoo funk, electro zouk, tropical bass, digidub, baroque techno, folkmoot, jangle pop, psych soul, mutant soul, experimental opera, cinematic trap, spectral folk, broken beat, glitch jazz, digital folk, noir jazz, chamber soul, experimental gospel, dub techno, death gospel, gospel blues, hypnagogic pop, yacht rock, freak jazz, deep step, lo-fi metal, synth boogie, ghostwave, spaghetti funk, medieval chant, delta trance, industrial gospel, urban folk, neon soul, free folk, dark country, lounge exotica, post-bop, cyber folk, blue-eyed soul, proto-house, devotional music, underground disco, drone blues, electro tango, j-punk, samba rock, industrial blues, southern gothic, post-krautrock, psychedelic cumbia, creole jazz, dark ambient, hybrid jazz, bhangragga, spiritual ragas, baroque lounge, medieval jazz, lo-fi gospel, synth punk, drone rock, future ragtime, balkan beats, electrofolk, world fusion, Appalachian folk, lowrider soul, chill drill, deep drill, doom folk, space cumbia, orchestral breaks, cosmic reggae, modal jazz, cinematic rock, microfunk, jazz grime, desert house, noise folk, arctic ambient, spectral dub, cowboy funk, afro-glitch, analog soul, future psych, horror surf, tropical jazz, slowcore blues, klezmer funk, noir soul, shadow jazz, jungle funk, spiritual grime, vapor blues, cinematic funk, ethereal blues, mutant gospel, hypersoul, ambient trap, modular jazz, ghost trap, sludgy funk, hauntology, dream grime, nu-rave, dystopian funk, melodic breaks, ethereal industrial, astral jazz, nostalgic house, jungle swing, minimalist folk, proto-trap, soundtrack soul, cyber ragtime, harmonic techno, solar jazz, space-age pop, peruvian psych, twisted funk, subterranean blues, electro bossa, voodoo blues, trip-folk, ghostly house, post-modern jazz, ambient funk, hyperdub, tape funk, bass gospel, cinematic shoegaze, psych cabaret, horror soul, cinematic synth, swamp jazz, spectral techno, desert blues rock, celestial gospel, dream pop noir, experimental salsa, baroque groove, apocalyptic folk, gothic Americana, breakbeat soul, nordic jazz, introspective techno, cold trap, deep reggaeton, tribal synth, cinematic afrobeat, spectral house, neon funk, deep noir, hyper jazz, chamber psych, bluegrass soul, post-punk funk, noise gospel, avant-reggae, modular funk, cinematic folk noir, microjazz, psychedelic new wave, ethereal surf, future folk, deep spaghetti western, hyperspace jazz, ghostly blues, futuristic gospel, mutant surf, subterranean funk, hallucinogenic folk, subaquatic dub, sacred post-punk, fractured soul, ancient funk, hyper-baroque, voodoo jazz, space funk noir, tribal garage, industrial ambient, ethereal spaghetti western, inverted blues, electro-melodica, ritual house, transcendental trap, drone trap, ghostly funk, vapor jazz, mind-bending dub, orchestral punk, resonant soul, liminal funk, electro cha-cha, sepia jazz, lo-fi trance, celestial grunge, deep electro swing, mystic country, hyper-chamber, cyber cabaret, futuristic folk rock, medieval funk, outer space cumbia, celestial trap, tribal shoegaze, hyper-soul, swamp funk blues, spectral drill, gothic dub, progressive grime, chamber house, mythic folk, electro bolero, ambient gospel, deep swamp reggae, ambient surf, dark sci-fi jazz, lo-fi flamenco, modular blues, spectral bass, desert funk, aquatic blues, deep horror groove, luminous house, cosmic gospel, cabaret funk, experimental swing, chamber ambient, cinematic indie folk, ethereal cumbia, spectral swing, bionic blues, ghost disco, ritual grime, dream noir, cosmic ragtime, retro-futurist dub, submerged jazz, haunted house, molecular soul, cinematic surf, warped blues, fractured funk, noir techno, underground folk, cosmic trap, celestial folk noir, shapeshifting jazz, liquid dub, dystopian gospel, futuristic bossa nova, experimental chillwave, tape-warped funk, ritual dub, solar ambient, broken ragtime, gothic house, industrial jazz noir, spectral reggae, shimmering shoegaze, dreamy jungle, celestial raga, interdimensional funk, mystic shoegaze, deep cyber jazz, supernatural trap, haunted blues, cosmic garage, nocturnal folk, dream trap, hyper glitch, synthetic soul, cosmic doo-wop, spectral ambient blues, dub-infused house, immersive gospel, synthetic jazz, arcane funk, broken reggae, lush hyperpop, mutant ambient, celestial jungle, spectral synth pop, cinematic voodoo, glitch gospel, fractal funk, lucid folk, interstellar jazz, future trance, synthetic gospel, deep horror soul, phantom ragtime, mystical samba, post-trap, dream blues, fragmented swing, quantum funk, atmospheric disco, space gospel, spectral pop, mind-bending jazz, deconstructed blues, intergalactic house, transdimensional soul, surreal grime, avant-garde swing, abyssal funk, glitch country, surreal soul, neoclassical gospel, fractured jazz, digital boogaloo, spectral folk pop, cosmic big band, transcendental jungle, amorphous funk, neo-vaudeville, infinite jazz, avant-garde gospel, radiant house, psychotropical soul, labyrinthine blues, fragmented folk, celestial swing, warped folk".split(', ');
    
    // Function to get random tags that fit within maxLength
    const getRandomTags = (maxLength = 46) => {
        const result = [];
        const usedIndexes = new Set();
        let currentLength = 0;

         
        
        while (usedIndexes.size < tags.length) {
            const index = Math.floor(Math.random() * tags.length);
            if (usedIndexes.has(index)) continue;
        
            const tag = tags[index];
            const newLength = currentLength + tag.length + (result.length > 0 ? 2 : 0); // +2 for ", "
            
            if (newLength <= maxLength) {
                result.push(tag);
                currentLength = newLength;
            }
            
            usedIndexes.add(index);
            
            // Break if we can't fit any more tags
            if (result.length >= 2 && tags[index].length + 2 > maxLength - currentLength) break;
        }
        
        return result.join(', ');
    };

    function setupTypingAnimation(typedTextElement) {
        let currentText = '';
        let charIndex = 0;
        let isDeleting = false;
        let isWaiting = false;

        function type() {
            if (!isDeleting && charIndex === 0) {
                currentText = getRandomTags();
            }
            
            if (!isDeleting && charIndex < currentText.length) {
                typedTextElement.textContent = currentText.slice(0, charIndex + 1);
                charIndex++;
                setTimeout(type, 50);
            } else if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                setTimeout(type, 2000);
            } else if (isDeleting && charIndex > 0) {
                typedTextElement.textContent = currentText.slice(0, charIndex - 1);
                charIndex--;
                setTimeout(type, 30);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                setTimeout(type, 500);
            }
        }
        
        type();
    }

    // Set up typing animation for all search bars
    document.querySelectorAll('.typed-text').forEach(typedText => {
        setupTypingAnimation(typedText);
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const arrow = question.querySelector('.rotatable');
            
            answer.classList.toggle('open');
            arrow.classList.toggle('rotated');
        });
    });
});
