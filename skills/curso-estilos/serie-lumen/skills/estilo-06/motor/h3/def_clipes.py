"""Prompt de animação por plano (exemplo real: o ep6 do LUMEN). Grava clipes.json na pasta atual: rode de dentro da pasta h3 do episódio.
Cada prompt = ESTILO (trava de estilo, igual em todos) + a ação do plano (UMA ação clara) + FIM (câmera e proibições).
Quadros a 24 qps na grade do H3: 56 = 2,3 s, 73 = 3 s, 97 = 4 s, 121 = 5 s. Modelo completo, 20 passos, sem LoRA.
Para a sua série: troque ESTILO pela descrição do seu traço e C pelos seus planos."""
import json
ESTILO = ('Vertical 9:16 soft stylized 3D clay animation: round-headed toy-like characters with smooth capsule limbs, simple faces, '
          'matte clay materials, soft ambient occlusion, painterly dark misty forest with cold volumetric light and depth of field. '
          'Keep the exact art style, character design, face, clothes, framing and colors of the first frame. ')
FIM = (' Slow subtle cinematic camera push-in. Smooth natural character animation. No text, no subtitles, no letters, '
       'no new objects, no extra characters, no lens flare. Audio: quiet forest ambience.')
C = {
 'S01': (73, "The boy's frozen face trembles very slightly, a drop of sweat slides down his temple, his eye blinks once in fear, behind him in the fog the tall dark armored figure with a deep smooth dish-shaped helmet slowly turns its head, the faint blue concentric rings inside the helmet pulse, fog drifts."),
 'S02': (97, "The tall armored hunter slowly turns its head from left to right as if searching, the head keeps rotating a little too far past the shoulder like a machine, its deep smooth dish-shaped helmet with faint glowing blue concentric rings and no face pulsing softly, small pixel cubes crumble off the edges of its armor and drift away, fog swirls, branches sway."),
 'S03': (121, "The tall armored hunter with a deep smooth dish-shaped helmet walks slowly past with stiff mechanical steps, just one meter from the boy and the hunched old woman who crouch completely frozen behind the big root, only the fog moves around them, pixel cubes drift off the hunter's armor."),
 'S04': (97, "The hooded ranger sitting on the fallen log slowly mends her bowstring with careful fingers, looking down, the young archer standing in front of her gestures with open hands as he asks a question, leaves fall slowly, soft light."),
 'S05': (121, "The hooded ranger talks quietly with a sad face, looking down, her lips move gently, her white braid sways slightly, she holds the bow on her lap, soft light rays move through the trees."),
 'S05b': (56, "Faded memory: the small hooded boy seen from behind slowly raises his arm and points up at the starry sky, his cape sways in the wind, stars twinkle."),
 'S06': (73, "The ranger's fingers slowly stop moving on the bowstring and freeze, the string vibrates slightly, then stillness, a leaf falls past."),
 'S07': (97, "Birds hang frozen in mid-flight in the air, falling leaves stop in mid-air, the fog stops moving, the small archer in the middle slowly looks up in fear, total stillness except his head turning."),
 'S08': (73, "The hunched old woman grabs the boy's arm firmly and pulls him down, her serious urgent eyes stare at him, he freezes, fog drifts."),
 'S09': (121, "The tall armored hunter walks between the trees with stiff stuttering mechanical steps, one leg lifting slowly, pixel cubes trailing off behind it like a glitch, its deep smooth dish-shaped helmet with faint glowing blue concentric rings and no face pulsing softly, fog swirls."),
 'S09b': (56, "The single dry leaf drifts slowly down through the air, the tall armored hunter stands still with its head locked toward the leaf, its deep smooth dish-shaped helmet with faint glowing blue concentric rings and no face pulsing, a few pixel cubes drift off its neck, fog drifts."),
 'S10': (97, "The young archer crouches completely frozen holding his bow and arrow, only his eyes move slightly, his chest barely breathing, the tall shadow of the hunter slowly passes over him through the fog."),
 'S12': (73, "In slow motion the leather backpack strap slides off the boy's shoulder, the rolled wolf pelt inside slips out, dust floats in the light."),
 'S13': (73, "The hunched old woman lunges sideways to catch the falling backpack, in the background the tall armored hunter snaps its head toward her, the blue concentric rings inside its deep dish-shaped helmet flare brighter."),
 'S14': (97, "The tall armored hunter with a deep smooth dish-shaped helmet lifts the hunched old woman off the ground by the collar of her feather cloak, her little feet kick in the air, she struggles, the boy in the blurry foreground stays frozen, fog swirls."),
 'S16': (97, "The hooded young ranger hangs in the air held by the collar of her green coat by the tall armored hunter, she kicks and struggles, dry leaves and brown feathers fall slowly around her, the leather backpack lies on the ground by the boy's foot, fog swirls, the blue concentric rings inside the hunter's dish-shaped helmet pulse."),
 'S17': (73, "Close-up: the hooded young ranger hanging by her collar looks down at the boy calmly and slowly shakes her head no, her amber eyes glow, her white braid sways, dry leaves fall past her face."),
 'S15': (97, "Over the shoulder: the boy in the blurry foreground holds his drawn bow steady and aims, the arrow trembling very slightly on the string; in the middle of the frame the tall armored hunter with the deep dish-shaped helmet holds the hooded young ranger in the green coat by the collar, she kicks and struggles, dry leaves and feathers fall slowly, the blue rings inside the helmet pulse, fog drifts."),
}
json.dump({k: {'q': q, 'prompt': ESTILO + a + FIM} for k, (q, a) in C.items()}, open('clipes.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(len(C), 'clipes;', sum(q for q, _ in C.values()), 'quadros')
