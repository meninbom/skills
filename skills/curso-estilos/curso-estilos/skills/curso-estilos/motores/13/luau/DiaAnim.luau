-- animação procedural (edição) da série "cai um bicho": bonecos R6 ancorados + bichos
-- pose por atributo no modelo: Pose = "idle" | "olhaCima" | "ri" | "anda" | "puxa" | "acena"
local A={}
local REST={}
local ATIVOS={}
local function partsOf(m) local t={} for _,d in ipairs(m:GetDescendants()) do if d:IsA("BasePart") then table.insert(t,d) end end return t end
local function headGroup(m) local g={m.Head} for _,c in ipairs(m:GetChildren()) do if c:IsA("Accessory") and c:FindFirstChild("Handle") then table.insert(g,c.Handle) end end return g end
local function semente(m) local s=0 for i=1,#m.Name do s+=m.Name:byte(i) end return s end
function A.setup(raizes)
 REST={} ATIVOS={}
 for _,raiz in ipairs(raizes or {workspace.Personagens}) do
  for _,d in ipairs(raiz:GetDescendants()) do
   if d:IsA("Model") and (d:FindFirstChildOfClass("Humanoid") or d:GetAttribute("Bicho") or d.Name:match("^Vaca") or d.Name:match("^Tatu") or d.Name:match("^Aguia")) then
    if not ATIVOS[d] then ATIVOS[d]=true; for _,p in ipairs(partsOf(d)) do REST[p]=p.CFrame end end
   end
  end
 end
 for _,x in ipairs(A.EXTRA or {}) do REST[x]=x.CFrame end
end
function A.reset() for p,cf in pairs(REST) do if p.Parent then p.CFrame=cf end end end
local function rot(parts,piv,r) for _,p in ipairs(parts) do p.CFrame=piv*r*piv:Inverse()*p.CFrame end end
local function humano(m,t)
 local all=partsOf(m); for _,p in ipairs(all) do if REST[p] then p.CFrame=REST[p] end end
 local pose=m:GetAttribute("Pose") or "idle"; local ph=semente(m)%17*0.37
 local tor=m.Torso; local T0=REST[tor]; if not T0 then return end
 local sx,sy=tor.Size.X,tor.Size.Y
 local function arm(lado,ang,abre) local a=m:FindFirstChild(lado>0 and "Right Arm" or "Left Arm"); if not a then return end
  local piv=T0*CFrame.new(lado*sx*0.75,sy/4,0); a.CFrame=piv*CFrame.Angles(math.rad(ang),0,math.rad(lado*(abre or 0)))*piv:Inverse()*REST[a] end
 local function leg(lado,ang) local l=m:FindFirstChild(lado>0 and "Right Leg" or "Left Leg"); if not l then return end
  local piv=T0*CFrame.new(lado*sx*0.25,-sy/2,0); l.CFrame=piv*CFrame.Angles(math.rad(ang),0,0)*piv:Inverse()*REST[l] end
 local neck=T0*CFrame.new(0,sy/2,0)
 local resp=math.sin(t*2.1+ph)
 local bob=Vector3.new(0,0.04*resp,0)
 if pose=="anda" then
  local passo=t*5
  leg(1,25*math.sin(passo)); leg(-1,-25*math.sin(passo)); arm(1,-20*math.sin(passo),2); arm(-1,20*math.sin(passo),-2)
  rot(headGroup(m),neck,CFrame.Angles(math.rad(-14),0,0))
  local fwd=T0.LookVector*Vector3.new(1,0,1)
  bob=fwd.Unit*(t*(m:GetAttribute("Vel") or 2.6))+Vector3.new(0,math.abs(math.sin(passo))*0.1,0)
 elseif pose=="olhaCima" then
  arm(1,2*math.sin(t*1.3+ph),2); arm(-1,2*math.sin(t*1.3+ph+2),-2)
  rot(headGroup(m),neck,CFrame.Angles(math.rad(30+3*math.sin(t*0.8+ph)),math.rad(8*math.sin(t*0.4+ph)),0))
 elseif pose=="ri" then
  local k=math.sin(t*14+ph)
  arm(1,-10+6*k,8); arm(-1,-10-6*k,-8)
  rot(headGroup(m),neck,CFrame.Angles(math.rad(-12+6*k),0,0))
  bob=Vector3.new(0,0.08*math.abs(k),0)
 elseif pose=="puxa" then
  local e=math.clamp((t-0.6)/0.7,0,1); e=e*e*(3-2*e)
  -- braço já está levantado no repouso; desce puxando
  arm(1,-75*e,0)
  rot(headGroup(m),neck,CFrame.Angles(math.rad(10*e),0,0))
  for _,x in ipairs(A.ALAVANCA or {}) do x.CFrame=A.EIXO*CFrame.Angles(math.rad(70*e),0,0)*A.EIXO:Inverse()*REST[x] end
 elseif pose=="acena" then
  arm(1,-150+20*math.sin(t*6),10)
  rot(headGroup(m),neck,CFrame.Angles(0,math.rad(8*math.sin(t*0.7)),0))
 else
  arm(1,2.5*math.sin(t*1.3+ph),1.5+resp*0.8); arm(-1,2.5*math.sin(t*1.3+ph+2),-(1.5+resp*0.8))
  rot(headGroup(m),neck,CFrame.Angles(math.rad(3*math.sin(t*0.9+ph)),math.rad(14*math.sin(t*0.55+ph)+6*math.sin(t*1.7+ph*2)),0))
 end
 if bob.Magnitude>0 then for _,p in ipairs(all) do p.CFrame=p.CFrame+bob end end
end
local function bicho(m,t)
 local all=partsOf(m); for _,p in ipairs(all) do if REST[p] then p.CFrame=REST[p] end end
 local ph=semente(m)%13*0.5
 local cab=m:FindFirstChild("Cabeca")
 if m.Name:match("^Aguia") then
  local corpo=REST[m.Corpo]
  local voa=m:GetAttribute("Voa")
  local flap=math.sin(t*7+ph)
  for _,p in ipairs(all) do if p.Name:match("^Asa") then
   local lado=(corpo:PointToObjectSpace(REST[p].Position).X>0) and 1 or -1
   local piv=corpo*CFrame.new(lado*1.1*m.Corpo.Size.X/2.2,0.2,0)
   p.CFrame=piv*CFrame.Angles(0,0,math.rad(lado*28*flap))*piv:Inverse()*REST[p] end end
  local off=Vector3.new(0,0.35*math.sin(t*3.5+ph),0)
  if voa then off+=corpo.LookVector*(t*voa) end
  for _,p in ipairs(all) do p.CFrame=p.CFrame+off end
 else
  -- quadrúpede: respira e balança a cabeça
  local base=REST[m:FindFirstChild("Corpo") or m:FindFirstChild("Casco") or all[1]]
  if cab then
   local g={} for _,p in ipairs(all) do local lp=base:PointToObjectSpace(REST[p].Position); if lp.Z < -(m:FindFirstChild("Corpo") and m.Corpo.Size.Z*0.42 or 1.2) then table.insert(g,p) end end
   local piv=REST[cab]*CFrame.new(0,0,cab.Size.Z*0.5)
   rot(g,piv,CFrame.Angles(math.rad(6*math.sin(t*1.1+ph)+(m:GetAttribute("OlhaCima") and -18 or 0)),math.rad(10*math.sin(t*0.6+ph)),0))
  end
  local off=Vector3.new(0,0.05*math.sin(t*2+ph),0)
  for _,p in ipairs(all) do p.CFrame=p.CFrame+off end
 end
end
function A.step(t)
 for m in pairs(ATIVOS) do if m.Parent then
  if m:FindFirstChildOfClass("Humanoid") then if m.Name~="Multidao" then humano(m,t) end else bicho(m,t) end
 end end
end
return A
