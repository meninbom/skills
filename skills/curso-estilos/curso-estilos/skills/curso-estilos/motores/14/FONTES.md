# Fontes e licenças

Duas partes: (A) o que vem dentro deste motor e sob qual licença; (B) fatos e fontes do roteiro do exemplo "de onde vem o emoji".

## A. Arquivos do motor

| Arquivo | Origem | Licença |
|---|---|---|
| `kit_template/fonts/Bricolage.ttf`, `hf/fonts/Bricolage.ttf` | Bricolage Grotesque, © 2022 The Bricolage Grotesque Project Authors (github.com/ateliertriay/bricolage) | SIL Open Font License 1.1 (`licencas/BricolageGrotesque-OFL.txt`) |
| `kit_template/fonts/DepartureMono.otf`, `hf/fonts/DepartureMono.otf` | Departure Mono, © 2022–2024 Helena Zhang (departuremono.com) | SIL Open Font License 1.1 (mesmo texto da OFL em `licencas/`) |
| GSAP 3.12.5 (não vem no pacote) | GreenSock (gsap.com), baixado do npm pelo `npm install`; o `postinstall` copia para `vendor/` de cada composição | Licença padrão gratuita da GSAP (gsap.com/standard-license). Leia antes de usar em produto pago |
| `kit_template/img/foto_exemplo.png`, `hf/img/*.png` | Foto-adesivos do exemplo: fotos geradas por IA (Z-Image Turbo, local) e passadas pela retícula de `kit_ferramentas/adesivo_foto.py`; adesivos de pixel desenhados para o curso | Uso livre pelos alunos para estudo; na sua peça, use as suas imagens |

**Não vem no pacote:**
- a fonte japonesa do exemplo original (comercial): o `hf_src/src.html` usa a fonte japonesa do sistema; para fixar, baixe Noto Sans JP (OFL) do Google Fonts;
- a voz, a trilha e os efeitos sonoros: o exemplo renderiza mudo. A trilha original é "Chill Japan", na Pixabay (licença Pixabay, uso comercial sem crédito); os efeitos vieram de packs de foley livres de royalties que não podem ser redistribuídos.

## B. Exemplo "de onde vem o emoji": fatos, fontes e licenças

## Fatos do roteiro
| Fato | Fonte |
|---|---|
| i-mode (NTT Docomo), lançado em 1999; os emoji estrearam com ele | Wikipedia "Emoji"; designboom (27/10/2016) sobre a aquisição do MoMA |
| Limite de 250 caracteres por mensagem no i-mode | AP, 2016 ("The Man Who Created Emoji Says He Saw Nuance in Pictures", republicado por NBC: https://www.nbcchicago.com/news/national-international/japans-emoji-creator-saw-nuance-in-pictures/2028651/) |
| Kurita era funcionário da equipe do i-mode | AP 2016; site do governo do Japão (gov-online.go.jp, HLJ 08/2018); NTT Insights Hub ("The world's most familiar face") |
| 176 emoji, em cerca de 1 mês | NTT Insights Hub ("design all 176 Emoji in just a single month"); AP 2016 |
| Grade de 12×12 pixels | Wikipedia "Shigetaka Kurita" e "Emoji"; NTT Insights Hub |
| Inspiração em mangá, previsão do tempo e placas/pictogramas | Wikipedia "Emoji"; NTT Insights Hub (videogames e pictogramas) |
| e (絵, desenho) + moji (文字, letra); a semelhança com "emotion" é coincidência | Wikipedia "Emoji" |
| O MoMA adquiriu os 176 originais em 2016 (outubro) | Wikipedia "Shigetaka Kurita"; designboom 27/10/2016; dezeen 27/10/2016 |
| Tweet hoje: 280 caracteres (conta comum) | limite público do X |

**Cortado de propósito:**
- **"25 anos":** a AP diz 25, mas a Wikipedia dá nascimento em 9/5/1972 (26–27 anos em 1999). Ficou de fora.
- **"o primeiro emoji":** o set da SoftBank de 1997 é anterior, e o roteiro nunca diz "primeiro".

## Imagens
- Todas as fotos são geradas no Z-Image Turbo local (ComfyUI): Shibuya, celular flip, mão, mangá, mapa do tempo, placa e museu.
- Nenhuma imita um registro real de pessoa: o Kurita não aparece, só uma mão genérica.
- Na tela, sem crédito e sem tag. A legenda do post leva "imagens geradas por IA".
- Os adesivos de pixel foram desenhados por nós: não são os 176 do Kurita.

## Som
- **Trilha:** "190117 Chill Japan" (WELC0MEИ0), da Pixabay, sob a Pixabay Content License (uso comercial sem crédito): https://pixabay.com/music/main-title-190117-chill-japan-calm-simple-nostalgic-143427/
- **SFX** (Sonniss GDC bundles, livres de royalty):
  - Epic Stock Media "Board Game", carta;
  - Joshua Reinhardt "Ultimate Phone Bundle", teclado do flip phone;
  - CB Sound Design "Pencils";
  - SpillAudio "Paper".
- **Voz:** ElevenLabs (voz masculina brasileira da biblioteca pública).
