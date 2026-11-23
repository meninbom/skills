local M={}
local AN=require(game.ServerStorage.DiaAnim:Clone())
local V=Vector3.new; local C=Color3.fromRGB
local SS=game.ServerStorage; local PS=workspace.Personagens
M.SLOW=3
-- câmera deitada (90°) para gravar o 9:16 usando a largura da tela; FOV vertical da tela = horizontal da cena
M.ROLL=CFrame.Angles(0,0,math.rad(90)); M.FOV=36
-- ===== luz =====
local function luz(alvo,k) -- alvo: tabela de valores; k: mistura com o dia (1=alvo)
 local cfg=SS.LuzDia; local Lg=game.Lighting
 local objs={Lighting=Lg,Atmosphere=Lg.Atmosphere,ColorCorrection=Lg.ColorCorrection,Bloom=Lg.Bloom}
 for nome,v in pairs(cfg:GetAttributes()) do
  local o,p=nome:match("^(%w+)_(%w+)$"); local obj=objs[o]
  local w=alvo[nome]
  if w==nil then obj[p]=v
  elseif typeof(v)=="number" then obj[p]=v+(w-v)*k
  else obj[p]=v:Lerp(w,k) end
 end
end
M.NOITE={Lighting_ClockTime=0,Lighting_Brightness=0.5,Lighting_Ambient=C(35,40,70),Lighting_OutdoorAmbient=C(55,65,115),Lighting_ExposureCompensation=-0.1,
 Atmosphere_Color=C(35,45,95),Atmosphere_Decay=C(20,25,60),Atmosphere_Density=0.32,Atmosphere_Haze=0,ColorCorrection_TintColor=C(205,215,255),ColorCorrection_Saturation=0.05,Bloom_Intensity=0.8,Bloom_Threshold=1.0}
M.ESCURO={Lighting_Brightness=0.15,Lighting_ClockTime=17.6,Lighting_Ambient=C(60,50,75),Lighting_OutdoorAmbient=C(70,60,90),Lighting_ExposureCompensation=-0.9,
 Atmosphere_Color=C(90,70,100),Atmosphere_Decay=C(50,35,60),Atmosphere_Density=0.38,Atmosphere_Haze=1.5,ColorCorrection_TintColor=C(215,190,225),ColorCorrection_Saturation=-0.1,ColorCorrection_Contrast=0.15}
local function janelas(on)
 for _,d in ipairs(workspace.Cidade:GetDescendants()) do
  if d:IsA("BasePart") and (d.Name=="Vidro" or d.Name=="Lampada") then
   if on then d.Material=Enum.Material.Neon; d.Color=C(255,170,80) else d.Material=Enum.Material.SmoothPlastic; d.Color=(d.Name=="Vidro") and C(150,210,255) or C(255,245,200) end
  end end
end
local function mostra(nome,on,destino)
 local o=workspace:FindFirstChild(nome) or PS:FindFirstChild(nome) or workspace.Cidade:FindFirstChild(nome) or SS:FindFirstChild(nome)
 if not o then return end
 o.Parent = on and (destino or workspace) or SS
end
local function quente(on)
 local cx=workspace.Cidade.Casas.CasaTeo.Caixa
 cx.BrilhoQuente.Brightness=on and 1.1 or 0
 cx.Quente.FumacaQuente.Rate=on and 6 or 0; for _,e in ipairs(cx.FogoVFX4:GetChildren()) do e.Enabled=on end; cx.Quente.Brasa.Rate=on and 10 or 0
 workspace.Terrain.FumacaPenas.FumacaPenas.Rate=on and 3 or 0
 cx.Color=on and C(255,110,50) or C(40,110,220)
end
local function ceu(n)
 for _,c in ipairs(game.Lighting:GetChildren()) do if c:IsA('Sky') then c:Destroy() end end
 SS.Ceus[n]:Clone().Parent=game.Lighting
end
M.ceu=ceu
function M.cena(nome)
 ceu(nome=='noite' and 'CeuNoite' or (nome=='escuro' and 'CeuTempestade' or 'CeuDia'))
 janelas(false); quente(false); luz({},0)
 mostra("FenixIA",false); mostra("BichosManha",false); mostra("VacaCai",false)
 mostra("CenaNoite",false)
 if nome=="noite" then luz(M.NOITE,1); janelas(true); quente(true); mostra("CenaNoite",true,workspace.Cidade)
 elseif nome=="manha" then mostra("CenaNoite",true,workspace.Cidade); mostra("BichosManha",true,PS)
 elseif nome=="escuro" then mostra("CenaNoite",true,workspace.Cidade); mostra("BichosManha",true,PS); mostra("FenixIA",true); luz(M.ESCURO,1)
 elseif nome=="cai" then mostra("VacaCai",true,PS)
 end
end
-- ===== planos =====
-- {nome, posIni, alvoIni, posFim, alvoFim, dur, cena, poses, fn(t,e)}
local function poses(t) return t end
M.PLANOS={
 {"01_aereo", V(95,62,95),V(20,0,-10), V(62,30,42),V(36,2,0), 6, "dia"},
 {"02_maquina", V(23,3,-13),V(40,9,0), V(29,4.2,-8.5),V(40,10,-1), 5, "dia"},
 {"03_cai", V(29,3,13),V(40,24,0), V(30,3.2,11),V(39,5,1), 4.5, "cai", {}, "cai"},
 {"04_teo", V(33,4.8,-10.5),V(38.5,5.4,-5.5), V(33.8,5.3,-11.4),V(39,6.6,-4.6), 5, "dia"},
 {"05_tonho", V(36,4.6,3),V(26,5.5,13), V(33,4,6),V(26,5,13), 6, "dia", {SeuTonho="acena"}},
 {"06_bia", V(-0.5,4.6,48),V(-11.3,4.6,41.6), V(-1.5,5.2,45.5),V(-11.3,5.2,42), 6, "dia", {Bia_cartas="acena"}, "aguia"},
 {"07_jairo", V(2.8,4.4,63),V(10,3,53), V(4.2,3.8,60.5),V(10,3.2,53.5), 5, "dia"},
 {"08_regra", V(31,6.5,6),V(40,5,0), V(31,6.5,-6),V(40,5,0), 4, "dia"},
 {"09_multidao", V(64,24,24),V(36,2,-2), V(56,16,17),V(37,3,-2), 6, "dia"},
 {"10_alavanca", V(33,4.8,-10.5),V(38.5,5.4,-5.5), V(33.4,4.9,-10.9),V(38.5,5.6,-5.4), 3.5, "dia", {Teo="puxa"}},
 {"11_tubo", V(35.5,5,-6),V(40,21,0), V(36.5,4.6,-5.2),V(40,22.5,0), 4, "dia"},
 {"12_olhando", V(42,1.4,6),V(41,7,15), V(46.5,1.4,5.5),V(47,7.5,14), 5, "dia", {Multidao="olhaCima"}},
 {"13_casa", V(-3,4.2,20),V(-11,3,8), V(-3,4.2,4),V(-11,3,-8), 5.5, "dia", {Teo_anda="anda", Multidao="ri"}},
 {"14_caixa", V(-8,3.2,-11),V(-12.8,2.9,-16.2), V(-9.2,3.0,-13),V(-12.8,2.9,-16.2), 5, "noite"},
 {"15_penas", V(-14.0,2.6,-6.0),V(-15.8,0,-9.5), V(-14.0,2.4,-13.5),V(-15.8,0,-11), 5, "noite"},
 {"16_bichos", V(17,6.5,14),V(-14,4,-11), V(13.5,6.5,10.5),V(-16,5,-11), 5, "manha"},
 {"17_sombra", V(70,70,70),V(-10,0,-20), V(48,82,48),V(-20,0,-30), 6, "manha", {}, "escurece"},
 {"18_olho", V(-11.5,2.6,-0.5),V(-40,60,-62), V(-13,2.4,-3),V(-44,68,-68), 6, "escuro"},
 {"19_coleira", V(-26.5,22.9,-29.5),V(-38.6,46.0,-53.0), V(-30.3,30.6,-36.8),V(-38.6,44.0,-53.0), 5, "escuro"},
 {"20_teo", V(-16.6,3.6,-7.9),V(-15.4,4.9,-4.3), V(-16.3,3.9,-7.0),V(-15.4,5.1,-4.3), 6, "escuro", {Teo_quintal="olhaCima"}},
}
function M.slow(k) M.SLOW=k
 for _,e in ipairs(workspace:GetDescendants()) do if e:IsA("ParticleEmitter") then e.TimeScale=1/k end end
 for _,e in ipairs(SS:GetDescendants()) do if e:IsA("ParticleEmitter") then e.TimeScale=1/k end end
end
local function ease(t) return 0.5-0.5*math.cos(math.pi*t) end
local function aplicaPoses(p,on)
 for nome,pose in pairs(p[8] or {}) do
  local alvo=PS:FindFirstChild(nome)
  if alvo then
   if nome=="Multidao" then for _,x in ipairs(alvo:GetChildren()) do x:SetAttribute("Pose",on and pose or nil) end
   else alvo:SetAttribute("Pose",on and pose or nil) end
  end
 end
 if p[7]=="manha" or p[7]=="escuro" then local b=PS:FindFirstChild("BichosManha"); if b then for _,x in ipairs(b:GetChildren()) do x:SetAttribute("OlhaCima",on or nil) end end end
end
function M.prep(i)
 game:GetService("Selection"):Set({})
 local p=M.PLANOS[i]; M.cena(p[7])
 local cam=workspace.CurrentCamera; cam.CameraType=Enum.CameraType.Scriptable; cam.FieldOfView=M.FOV
 cam.CFrame=CFrame.lookAt(p[2],p[3])*M.ROLL
 local Mq=workspace.Cidade.Praca.Maquina
 AN.ALAVANCA={Mq.Haste,Mq.Bola}; AN.EIXO=Mq.Eixo.CFrame
 AN.EXTRA={Mq.Haste,Mq.Bola}
 local vc=PS:FindFirstChild("VacaCai"); if vc then AN.EXTRA={Mq.Haste,Mq.Bola,table.unpack(vc:GetDescendants())} end
 local ex={} for _,x in ipairs(AN.EXTRA) do if x:IsA("BasePart") then table.insert(ex,x) end end; AN.EXTRA=ex
 task.wait(6); return p[1]
end
local function extra(p,t)
 if p[9]=="cai" then
  local vc=PS:FindFirstChild("VacaCai"); if vc then
   local h=math.max(0,30-(t*t)*3.2); local pousou=h<=0
   if pousou and not M._boom then M._boom=true; local at=workspace.Cidade.Praca.PontoPouso.Estouro; at.VFX4_Estouro:Emit(1); at.VFX4_EstouroGlow:Emit(1); at.VFX4_EstouroFaisca:Emit(14) end
   local giro=pousou and 0 or t*4
   local cf=CFrame.lookAt(Vector3.new(34.5,2.0+h+(pousou and math.max(0,0.6*math.sin((t-3.06)*9))*math.exp(-(t-3.06)*3) or 0),5),Vector3.new(29,1.75+h,13))*CFrame.Angles(0,giro,math.rad(pousou and 0 or 18*math.sin(t*5)))
   if not M._vc0 then M._vc0=vc:GetPivot() end
   vc:PivotTo(cf)
  end
 elseif p[9]=="aguia" then
  local a=PS.Aguia; a:SetAttribute("Voa",nil)
 elseif p[9]=="escurece" then
  local k=math.clamp((t-1.2)/2.5,0,1); luz(M.ESCURO,k*k*(3-2*k)); if k>0.45 and not M._trocou then M._trocou=true; ceu('CeuTempestade') end
 end
end
function M.run(i)
 local p=M.PLANOS[i]; local cam=workspace.CurrentCamera
 aplicaPoses(p,true); M._vc0=nil; M._trocou=nil; M._boom=nil
 AN.setup({PS})
 local s0=os.clock()
 while (os.clock()-s0)<0.6*M.SLOW do AN.step((os.clock()-s0)/M.SLOW); extra(p,0); task.wait() end
 local s=os.clock()
 while true do local t=(os.clock()-s)/(p[6]*M.SLOW); if t>=1 then break end
  local e=ease(t); cam.CFrame=CFrame.lookAt(p[2]:Lerp(p[4],e),p[3]:Lerp(p[5],e))*M.ROLL
  local tt=(os.clock()-s)/M.SLOW; AN.step(tt+0.6); extra(p,tt); task.wait() end
 cam.CFrame=CFrame.lookAt(p[4],p[5])*M.ROLL
 local s2=os.clock(); while (os.clock()-s2)<0.6*M.SLOW do AN.step(p[6]+0.6+(os.clock()-s2)/M.SLOW); task.wait() end
 AN.reset(); aplicaPoses(p,false)
 local a=PS:FindFirstChild("Aguia"); if a then a:SetAttribute("Voa",nil) end
 return p[1]
end
return M
