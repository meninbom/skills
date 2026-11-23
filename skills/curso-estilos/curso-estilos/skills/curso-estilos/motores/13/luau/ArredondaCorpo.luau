local AS=game:GetService("AssetService")
local M={}
local cache={}
local X,Y,Z=Vector3.xAxis,Vector3.yAxis,Vector3.zAxis
-- face: normal, direção U (x da imagem cresce), direção V (y da imagem cresce, para baixo)
local FACES={F={-Z,-X,-Y},B={Z,X,-Y},R={X,-Z,-Y},L={-X,Z,-Y},U={Y,-X,-Z},D={-Y,-X,Z}}
local RECT={
 Torso={F={231,74,128,128},B={427,74,128,128},R={165,74,64,128},L={361,74,64,128},U={231,8,128,64},D={231,204,128,64}},
 Dir={L={19,355,64,128},B={85,355,64,128},R={151,355,64,128},F={217,355,64,128},U={217,289,64,64},D={217,485,64,64}},
 Esq={F={308,355,64,128},L={374,355,64,128},B={440,355,64,128},R={506,355,64,128},U={308,289,64,64},D={308,485,64,64}},
}
local function lista(h,r) return {-h,-h+r*0.3,-h+r*0.7,-(h-r),(h-r),h-r*0.7,h-r*0.3,h} end
local function dot(a,b) return a.X*b.X+a.Y*b.Y+a.Z*b.Z end
local function absv(v) return Vector3.new(math.abs(v.X),math.abs(v.Y),math.abs(v.Z)) end
function M.malha(size,r,tipo)
 local key=string.format("%.3f_%.3f_%.3f_%.3f_%s",size.X,size.Y,size.Z,r,tipo)
 if cache[key] then return cache[key] end
 local H=size/2; r=math.min(r,H.X*0.95,H.Y*0.95,H.Z*0.95)
 local I=H-Vector3.new(r,r,r)
 local em=AS:CreateEditableMesh()
 for nome,f in pairs(FACES) do
  local N,U,V=f[1],f[2],f[3]
  local hU=dot(H,absv(U)); local hV=dot(H,absv(V)); local hN=dot(H,absv(N))
  local us=lista(hU,r); local vs=lista(hV,r)
  local rc=RECT[tipo][nome]
  local ids,nr,uv={},{},{}
  for i=1,8 do ids[i]={}; nr[i]={}; uv[i]={} for j=1,8 do
   local P=N*hN+U*us[i]+V*vs[j]
   local inn=Vector3.new(math.clamp(P.X,-I.X,I.X),math.clamp(P.Y,-I.Y,I.Y),math.clamp(P.Z,-I.Z,I.Z))
   local d=P-inn; local n=d.Magnitude>1e-6 and d.Unit or N
   ids[i][j]=em:AddVertex(inn+n*r); nr[i][j]=em:AddNormal(n)
   local tu=(us[i]+hU)/(2*hU); local tv=(vs[j]+hV)/(2*hV)
   uv[i][j]=em:AddUV(Vector2.new((rc[1]+rc[3]*tu)/585,(rc[2]+rc[4]*tv)/559))
  end end
  -- ordem do triângulo: N = U x V ? senão inverte
  local flip = dot(U:Cross(V),N) < 0
  for i=1,7 do for j=1,7 do
   local q={{i,j},{i+1,j},{i+1,j+1},{i,j+1}}
   local tris = flip and {{1,3,2},{1,4,3}} or {{1,2,3},{1,3,4}}
   for _,t in ipairs(tris) do
    local a,b,c=q[t[1]],q[t[2]],q[t[3]]
    local fid=em:AddTriangle(ids[a[1]][a[2]],ids[b[1]][b[2]],ids[c[1]][c[2]])
    em:SetFaceNormals(fid,{nr[a[1]][a[2]],nr[b[1]][b[2]],nr[c[1]][c[2]]})
    em:SetFaceUVs(fid,{uv[a[1]][a[2]],uv[b[1]][b[2]],uv[c[1]][c[2]]})
   end
  end end
 end
 cache[key]=em; return em
end
local TIPO={Torso="Torso",["Right Arm"]="Dir",["Left Arm"]="Esq",["Right Leg"]="Dir",["Left Leg"]="Esq"}
function M.boneco(m,cima,baixo,r,lixo)
 for nome,tipo in pairs(TIPO) do
  local p=m:FindFirstChild(nome)
  if p and p:IsA("BasePart") then
   local rr=r*math.min(p.Size.X,p.Size.Z)
   local mp=AS:CreateMeshPartAsync(Content.fromObject(M.malha(p.Size,rr,tipo)))
   mp.Size=p.Size; mp.CFrame=p.CFrame; mp.Anchored=true; mp.Name=p.Name; mp.Color=Color3.new(1,1,1)
   mp.TextureID=(nome:find("Leg") and baixo or cima)
   mp:SetAttribute("CorpoTipo",tipo); mp:SetAttribute("CorpoR",rr)
   for _,c in ipairs(p:GetChildren()) do c.Parent=mp end
   mp.Parent=m; p.Parent=lixo
  end
 end
end
function M.refazer(raiz)
 local n=0
 for _,mp in ipairs((raiz or workspace):GetDescendants()) do
  local t=mp:IsA("MeshPart") and mp:GetAttribute("CorpoTipo")
  if t then local tx=mp.TextureID; mp:ApplyMesh(AS:CreateMeshPartAsync(Content.fromObject(M.malha(mp.Size,mp:GetAttribute("CorpoR"),t)))); mp.TextureID=tx; n+=1 end
 end
 return n
end
return M
