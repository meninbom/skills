---
name: geo-tales
description: "Vídeo curto de geografia/história contado em cima de mapa de satélite, no formato dos canais de geografia em mapa de satélite (câmera voando no mapa, regiões pintadas, rótulos limpos, ilustrações pintadas, voz de IA, legenda pequena). Use quando pedirem \"vídeo de mapa\", \"geo tales\", \"explicativo de geografia\", \"por que tal país/cidade/fronteira é assim\", ou um episódio novo dessa linha. Tem o motor em código (three.js + camada 2D, com demo de um comando), a receita das ilustrações em IA de imagem local, o método de voz/legenda/som e a ordem de produção com os pontos de aprovação. NÃO use para mapa em traço de mangá, dataviz sem mapa, nem vídeo com personagem animado em cena."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# geo-tales

Formato: 60–80 s, 9:16, um "por quê" de geografia respondido em cima do mapa. Estilo inspirado em canais de geografia contada em cima de mapa de satélite. Nosso piloto: "O Brasil mora na praia" (72 s); a cena, os prompts e a narração dele estão em `motor/exemplo/`.

Leia antes de produzir: `FORMATO.md` (o que o vídeo é: roteiro, visual, ilustração, texto, câmera) e `MOTOR.md` (como fazer: dados, cena, voz, legenda, som, render). Os dois são curtos.

**Comece pelo demo**: copie a pasta `motor/` para a pasta do seu projeto e rode `npm install` e `npm run demo` (ver `motor/DEMO.md`). Sai um MP4 mudo de 3 s. Só depois mexa na cena.

## Regra número 1: comparar com a referência antes de polir

No piloto, quatro versões saíram com cara de rascunho, e polir movimento (easing, desfoque) não resolveu nada. O que resolveu foi abrir um vídeo de referência do mesmo assunto, pôr quadro ao lado de quadro e copiar o que faltava: texto limpo, cor viva com borda fina, ilustração pintada. Todo episódio começa com essa folha lado a lado (referência × seu quadro), não com o render. Modelo da folha: `motor/exemplo/antes_depois.jpg`.

## Ordem de produção (com os pontos de aprovação)

Se você produz para outra pessoa (cliente, sócio, canal), os pontos marcados com **aprovação** são onde ela decide. Sozinho, são onde você para e olha com calma.

1. **Tema e fatos.** Um "por quê" com resposta visual no mapa. Conferir cada número em fonte primária (IBGE, texto original) e anotar no `FONTES.md` do episódio (modelo em `motor/exemplo/FONTES.md`).
2. **Roteiro → aprovação antes de qualquer voz.** Ver `FORMATO.md` §1. Essa parte da skill é a menos madura: o roteiro do piloto funcionou para produzir, mas é o ponto mais fraco da peça.
3. **Dados do mapa** (`prepara.py` do episódio): regiões em GeoJSON, recortes de satélite de perto com relevo.
4. **Ilustrações em IA de imagem** (Z-Image no ComfyUI local é grátis, ~12 s cada; qualquer gerador serve) → recorte de fundo → `dados/ilus/`.
5. **Cena muda** com tempos estimados → **folha de quadros ao lado da referência** → aprovação da direção (prints numerados).
6. **Voz** (paga): estimar o custo em caracteres antes de gerar. Duas vozes para escolher de ouvido. Uma tomada só, sem acelerar.
7. **Reancorar a cena na voz** (tabela ANC), legendas pelos tempos reais das palavras, som (voz + poucos efeitos).
8. **Render → conferir com a skill `checar-video` do pacote → versão leve de celular** (720p) para revisão.

## O que não fazer (tudo isso deu errado no piloto)

- Desenhar personagem/ícone em código ou usar emoji: fica abaixo da referência. É ilustração pintada. (O cartão do demo é só um placeholder.)
- Contorno escuro grosso no texto (cara de meme).
- Tomada inclinada com meio quadro de mar liso.
- Renderizar o filme inteiro (20–30 min) para testar uma ideia: quadro parado sai em 10 s.
- Mexer na voz para caber na cena. A cena é que estica.
- Crédito na tela. Licenças vão no `FONTES.md`; a atribuição do Sentinel-2 (CC BY) vai na descrição do post.
