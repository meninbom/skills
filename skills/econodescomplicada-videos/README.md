# Econo Descomplicada — vídeos portáteis

Esta skill preserva a identidade visual, o roteiro de cinco cenas, o gancho dos três primeiros segundos, o mascote Moedinha, as especificações de áudio/vídeo e as exigências de QA. O que mudou é a **forma de localizar recursos e testar o ambiente**: nada depende de uma pasta específica de um Mac Intel, de um venv antigo ou de um nome particular de agente.

## O que é portátil (e o que não é)

- **Portátil:** briefing, regras da série, configuração, diagnóstico, roteiro/legenda e orientações de produção. O preflight usa somente Python 3.8+ e bibliotecas padrão.
- **Não incluído neste repositório:** sprites Moedinha, motor externo estilo #07, episódios anteriores, narração edge-tts, Codex CLI, Chrome/Chromium, Node, FFmpeg, checar-video e Drive. É preciso obter/instalar esses recursos de forma autorizada. A skill não vira um renderizador autônomo por ter um JSON de configuração.
- **Opcional:** animações extras e expressões propostas no PR #6. A skill reconhece os nomes, mas não finge que os sprites estão instalados.

## Instalar/configurar em qualquer computador

1. Instale Python 3.8+.
2. Faça uma cópia de config.example.json chamada config.local.json na pasta desta skill. Ela é ignorada pelo Git. Preencha os diretórios reais.
3. Copie ou monte em local acessível os recursos externos legítimos (motor #07, sprites, template e referências). Nunca edite o motor de origem.
4. Planejamento pode acontecer sem renderizador. Para render real, instale as ferramentas do PATH: Node/npm, FFmpeg/ffprobe, Chrome/Chromium, Codex CLI + codex-image (ou seu provedor de imagens) e edge-tts (ou backend equivalente com timestamps).
5. Rode o diagnóstico antes de qualquer produção.

~~~bash
# A partir da pasta desta skill
python3 scripts/preflight.py --config config.local.json --stage plan
python3 scripts/preflight.py --config config.local.json --stage render
python3 scripts/preflight.py --config config.local.json --stage publish --json
~~~

Saída: READY ou NOT_READY, com erros e avisos específicos. O diagnóstico não instala nada, não acessa conta, não gera imagem e não usa cota de IA. No estágio publish, a conexão real do Drive continua sendo verificada pelo agente.

### Configuração de exemplo

Os caminhos relativos são resolvidos a partir de config.local.json, e não do diretório onde o comando foi executado.

~~~json
{
  "paths": {
    "workspace": "./workspace",
    "engine": "/caminho/do/motor-07",
    "episode_template": "/caminho/do/episodio-modelo",
    "sprites": "/caminho/dos/sprites",
    "style_reference": "/caminho/da/referencia.png",
    "checker_script": "/caminho/do/checar.py",
    "browser": ""
  },
  "production": {
    "image_backend": "codex-image",
    "tts_backend": "edge-tts",
    "render_workers": "auto"
  },
  "archive": {
    "mode": "local",
    "drive_folder_id": ""
  }
}
~~~

No Windows nativo use caminhos como C:/Projetos/econo/motor-07; no WSL use os caminhos Linux correspondentes, como /mnt/c/... ; no macOS e Linux use o caminho local existente. Não copie os exemplos literalmente. O Chrome pode ser detectado automaticamente.

### Sobrescritas por ambiente

Você pode configurar ECONO_CONFIG para apontar a um JSON diferente; ECONO_WORKSPACE, ECONO_ENGINE_DIR, ECONO_TEMPLATE_DIR, ECONO_SPRITES_DIR, ECONO_STYLE_REFERENCE, ECONO_CHECKER_SCRIPT e ECONO_BROWSER_PATH substituem os respectivos caminhos. ECONO_RENDER_WORKERS, ECONO_IMAGE_BACKEND, ECONO_TTS_BACKEND, ECONO_ARCHIVE_MODE e ECONO_DRIVE_FOLDER_ID substituem as opções.

Exemplo sem alterar arquivos versionados:

~~~bash
ECONO_CONFIG=/caminho/seguro/config.local.json python3 scripts/preflight.py --stage render --json
~~~

O campo render_workers aceita auto ou inteiro entre 1 e 32. Em auto, usa um valor conservador de 1 a 4, baseado nos núcleos da CPU; render pesado pode exigir reduzi-lo manualmente.

## Migração da antiga instalação no Mac Intel

1. Na máquina antiga, **localize** os diretórios do projeto, motor, sprites (incluindo os adicionais), episódio-modelo, estilos e checker. O PR #6 documenta uma instalação local em Documents/Cursos, mas aqueles caminhos não são obrigatórios nem estão disponíveis em outras máquinas.
2. Transfira apenas os arquivos que você tem permissão de usar. Copie os sprites sem alterar alfa e os projetos usados como referência.
3. Preencha config.local.json com os caminhos da máquina nova. Não carregue venv antigo ou node_modules da máquina anterior: recrie os ambientes de Python/Node e confira versões de ferramentas e dependências.
4. Execute o preflight plan e render. Se houver recursos faltantes, corrija exatamente os itens apontados. Valide um roteiro e um render de teste antes de produzir em lote.
5. Se quiser Drive, use archive.mode google-drive e configure a pasta em ambiente local; o agente deve confirmar qual conta está conectada antes de publicar.

## Contrato de execução

- Se o usuário pedir só ideias, roteiro ou legenda: stage plan é suficiente.
- Se pedir gerar placas, voz ou vídeo: stage render deve passar, e os recursos externos precisam ser utilizados de verdade.
- Se pedir vídeo final publicado: os três estágios precisam estar verificáveis, o QA do SKILL.md precisa ser cumprido, e upload só pode ser afirmado depois de confirmado.
- Se um provedor alternativo estiver configurado, o preflight avisa que não consegue verificar semanticamente sua equivalência. Não esconda essa limitação.
- Se a fonte de episódios anteriores não estiver disponível, gere apenas um rascunho não numerado. Não invente qual seria o próximo episódio.

## Testes offline

~~~bash
python3 -m unittest discover -s tests -v
~~~

Os testes do preflight são independentes do motor, do Codex, do Drive e de máquina específica. **Eles não testam a geração completa**, que depende de um ambiente provisionado com os assets e ferramentas reais.

### Relação com PRs anteriores

- PR #5 introduziu a estrutura editorial e as regras fortes de gancho da série; elas foram preservadas.
- PR #6 propõe expressões adicionais da Moedinha e documenta um setup específico de Mac Intel. Esta proposta preserva as sugestões criativas como **opcionais** e não importa os caminhos absolutos do Mac. O PR #6 continua independente e deve ser reconciliado antes de eventual merge.
