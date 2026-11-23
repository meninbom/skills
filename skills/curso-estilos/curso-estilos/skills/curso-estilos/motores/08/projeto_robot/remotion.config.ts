import {Config} from '@remotion/cli/config';

// ANGLE: renderizador que funciona no Chrome headless com placa de video.
// Sem GPU (ou com a GPU ocupada), DEMO_CPU=1 troca para o renderizador por software (swangle = ANGLE + SwiftShader).
Config.setChromiumOpenGlRenderer(process.env.DEMO_CPU ? 'swangle' : 'angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setCachingEnabled(false);
// poucos workers: o render divide a maquina com o que mais estiver rodando
Config.setConcurrency(Number(process.env.DEMO_WORKERS || 4));
