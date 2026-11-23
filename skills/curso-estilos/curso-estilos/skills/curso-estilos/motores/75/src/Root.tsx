import React from "react";
import { Composition } from "remotion";
import { BridgeShort as BalaoShort, BRIDGE_FRAMES as BALAO_FRAMES } from "./videos/balao/Bridge";

// Uma composição: o curta de exemplo "Os primeiros passageiros" (27,5 s). O tamanho é sempre 1080x1920;
// para sair menor ou maior use a escala do render (o pós está escrito para 1080x1920 e acompanha a escala).
export const RemotionRoot: React.FC = () => (
  <Composition id="BalaoShort" component={BalaoShort} durationInFrames={BALAO_FRAMES} fps={30} width={1080} height={1920} />
);
