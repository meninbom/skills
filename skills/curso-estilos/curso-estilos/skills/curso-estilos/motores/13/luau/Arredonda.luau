local AS=game:GetService("AssetService")
local M={}
local cache={}
local function lista(h,r) return {-h,-h+r*0.3,-h+r*0.7,-(h-r),(h-r),h-r*0.7,h-r*0.3,h} end
function M.malha(size,r)
 local key=string.format("%.2f_%.2f_%.2f_%.2f",size.X,size.Y,size.Z,r)
 if cache[key] then return cache[key] end
 local H=size/2; r=math.min(r,H.X*0.95,H.Y*0.95,H.Z*0.95)
 local I=H-Vector3.new(r,r,r)
 local em=AS:CreateEditableMesh()
 local function ponto(P)
  local inn=Vector3.new(math.clamp(P.X,-I.X,I.X),math.clamp(P.Y,-I.Y,I.Y),math.clamp(P.Z,-I.Z,I.Z))
  local d=P-inn; local n=d.Magnitude>1e-6 and d.Unit or Vector3.yAxis
  return inn+n*r,n
 end
 -- 6 faces: eixo normal e dois eixos de grade
 local faces={{Vector3.xAxis,Vector3.yAxis,Vector3.zAxis},{-Vector3.xAxis,Vector3.zAxis,Vector3.yAxis},
  {Vector3.yAxis,Vector3.zAxis,Vector3.xAxis},{-Vector3.yAxis,Vector3.xAxis,Vector3.zAxis},
  {Vector3.zAxis,Vector3.xAxis,Vector3.yAxis},{-Vector3.zAxis,Vector3.yAxis,Vector3.xAxis}}
 local function comp(v,ax) return math.abs(ax.X)>0 and v.X or (math.abs(ax.Y)>0 and v.Y or v.Z) end
 for _,f in ipairs(faces) do
  local N,U,V=f[1],f[2],f[3]
  local us=lista(comp(H,U),r); local vs=lista(comp(H,V),r); local hn=comp(H,N)
  local ids,nrm={},{}
  for i=1,8 do ids[i]={}; nrm[i]={} for j=1,8 do
   local P=N*hn+U*us[i]+V*vs[j]
   local p,n=ponto(P); ids[i][j]=em:AddVertex(p); nrm[i][j]=em:AddNormal(n)
  end end
  for i=1,7 do for j=1,7 do
   local a,b,c,d=ids[i][j],ids[i+1][j],ids[i+1][j+1],ids[i][j+1]
   local t1=em:AddTriangle(a,b,c); local t2=em:AddTriangle(a,c,d)
   em:SetFaceNormals(t1,{nrm[i][j],nrm[i+1][j],nrm[i+1][j+1]})
   em:SetFaceNormals(t2,{nrm[i][j],nrm[i+1][j+1],nrm[i][j+1]})
  end end
 end
 cache[key]=em; return em
end
function M.trocar(part,r,lixo)
 local em=M.malha(part.Size,r)
 local mp=AS:CreateMeshPartAsync(Content.fromObject(em))
 mp.Size=part.Size; mp.CFrame=part.CFrame; mp.Color=part.Color; mp.Material=part.Material
 mp.Anchored=true; mp.CastShadow=part.CastShadow; mp.Transparency=part.Transparency; mp.Name=part.Name
 for _,c in ipairs(part:GetChildren()) do c.Parent=mp end
 mp:SetAttribute("ArredR",r)
 mp.Parent=part.Parent; part.Parent=lixo
 return mp
end
-- reabrir o arquivo: a malha não é salva (fica só na memória). Isto refaz em todas as peças marcadas.
function M.refazer(raiz)
 local AS2=game:GetService("AssetService"); local n=0
 for _,mp in ipairs((raiz or workspace):GetDescendants()) do
  local r=mp:IsA("MeshPart") and mp:GetAttribute("ArredR")
  if r then
   local novo=AS2:CreateMeshPartAsync(Content.fromObject(M.malha(mp.Size,r)))
   mp:ApplyMesh(novo); n+=1
  end
 end
 return n
end
return M
