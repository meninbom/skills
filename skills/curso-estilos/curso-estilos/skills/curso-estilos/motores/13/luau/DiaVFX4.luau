-- Texturas: troque cada rbxassetid://0 pelo id da SUA imagem (gerada por vfx4/desenhar.py e enviada com upload_image).
local M={}
M.T={chama="rbxassetid://0",estouro="rbxassetid://0",faisca="rbxassetid://0",glow_chama="rbxassetid://0",glow_estouro="rbxassetid://0"}
local NS=NumberSequence.new; local K=NumberSequenceKeypoint.new; local C=Color3.fromRGB
-- fogo contínuo desenhado: chama (cor desenhada) + glow (aditivo) + faíscas
function M.fogo(att,esc)
 esc=esc or 1
 local f=Instance.new("ParticleEmitter",att); f.Name="VFX4_Chama"; f.Texture=M.T.chama; f.Rate=14; f.Lifetime=NumberRange.new(0.5,0.8)
 f.Speed=NumberRange.new(2*esc,4*esc); f.SpreadAngle=Vector2.new(18,18); f.Acceleration=Vector3.new(0,6*esc,0)
 f.Size=NS({K(0,3*esc),K(0.35,6*esc),K(1,1*esc)}); f.Transparency=NS({K(0,1),K(0.12,0),K(0.75,0),K(1,1)})
 f.Rotation=NumberRange.new(-105,-75) -- câmera deitada 90°; f.RotSpeed=NumberRange.new(-20,20); f.LightEmission=0.15; f.LightInfluence=0; f.ZOffset=1
 local g=Instance.new("ParticleEmitter",att); g.Name="VFX4_Glow"; g.Texture=M.T.glow_chama; g.Rate=6; g.Lifetime=NumberRange.new(0.6,1)
 g.Speed=NumberRange.new(1*esc,2*esc); g.Size=NS({K(0,7*esc),K(1,10*esc)}); g.Transparency=NS({K(0,1),K(0.2,0.45),K(1,1)})
 g.Color=ColorSequence.new(C(255,140,40),C(255,60,20)); g.LightEmission=1; g.LightInfluence=0; g.ZOffset=0
 local s=Instance.new("ParticleEmitter",att); s.Name="VFX4_Faisca"; s.Texture=M.T.faisca; s.Rate=10; s.Lifetime=NumberRange.new(0.6,1.1)
 s.Speed=NumberRange.new(6*esc,12*esc); s.SpreadAngle=Vector2.new(40,40); s.Acceleration=Vector3.new(0,-4*esc,0)
 s.Size=NS({K(0,0.9*esc),K(1,0)}); s.Orientation=Enum.ParticleOrientation.VelocityParallel; s.LightEmission=0.6; s.LightInfluence=0; s.ZOffset=2
 return {f,g,s}
end
-- estouro de impacto (Emit): estrela desenhada + glow + faíscas radiais
function M.estouro(att,esc)
 esc=esc or 1
 local e=Instance.new("ParticleEmitter",att); e.Name="VFX4_Estouro"; e.Texture=M.T.estouro; e.Rate=0; e.Lifetime=NumberRange.new(0.35)
 e.Speed=NumberRange.new(0); e.Size=NS({K(0,2*esc),K(0.25,7*esc),K(1,8*esc)}); e.Transparency=NS({K(0,0),K(0.6,0),K(1,1)})
 e.Rotation=NumberRange.new(0,360); e.LightEmission=0.2; e.LightInfluence=0; e.LockedToPart=true; e.ZOffset=2
 local g=Instance.new("ParticleEmitter",att); g.Name="VFX4_EstouroGlow"; g.Texture=M.T.glow_estouro; g.Rate=0; g.Lifetime=NumberRange.new(0.4)
 g.Speed=NumberRange.new(0); g.Size=NS({K(0,4*esc),K(1,12*esc)}); g.Transparency=NS({K(0,0.2),K(1,1)}); g.Color=ColorSequence.new(C(255,190,80))
 g.LightEmission=1; g.LightInfluence=0; g.LockedToPart=true; g.ZOffset=1
 local s=Instance.new("ParticleEmitter",att); s.Name="VFX4_EstouroFaisca"; s.Texture=M.T.faisca; s.Rate=0; s.Lifetime=NumberRange.new(0.3,0.55)
 s.Speed=NumberRange.new(18*esc,30*esc); s.SpreadAngle=Vector2.new(180,180); s.Drag=6
 s.Size=NS({K(0,1.4*esc),K(1,0)}); s.Orientation=Enum.ParticleOrientation.VelocityParallel; s.LightEmission=0.6; s.LightInfluence=0; s.ZOffset=3
 return function() e:Emit(1); g:Emit(1); s:Emit(14) end
end
return M
