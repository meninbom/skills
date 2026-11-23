-- Olhos: passe o id da sua imagem em L.olhos(..., img); o padrão rbxassetid://0 é só marcador.
local A=require(game.ServerStorage.Arredonda:Clone())
local L={}
L.lixo=game.ServerStorage.LibDia._descartes.pecas_quadradas
local C=Color3.fromRGB
-- peça arredondada (r=nil -> automático); forma: "bola","cil" ficam Part normais
function L.P(par,nome,size,cf,cor,r,forma)
 local p=Instance.new("Part"); p.Name=nome; p.Size=size; p.CFrame=cf; p.Color=cor; p.Material=Enum.Material.SmoothPlastic
 p.Anchored=true; p.TopSurface=0; p.BottomSurface=0; p.Parent=par
 if forma=="bola" then p.Shape=Enum.PartType.Ball return p end
 if forma=="cil" then p.Shape=Enum.PartType.Cylinder return p end
 local mn=math.min(size.X,size.Y,size.Z)
 return A.trocar(p,r or math.min(0.5,mn*0.35),L.lixo)
end
function L.texto(part,face,txt,cor,ppm,fonte)
 local g=Instance.new("SurfaceGui",part); g.Face=face; g.PixelsPerStud=ppm or 25; g.LightInfluence=0.3
 local t=Instance.new("TextLabel",g); t.Size=UDim2.fromScale(1,1); t.BackgroundTransparency=1; t.Text=txt; t.TextScaled=true; t.Font=fonte or Enum.Font.FredokaOne; t.TextColor3=cor or C(255,255,255)
 return t
end
function L.olhos(part,face,img,w,h,y)
 local g=Instance.new("SurfaceGui",part); g.Face=face; g.PixelsPerStud=80; g.LightInfluence=1
 local i=Instance.new("ImageLabel",g); i.BackgroundTransparency=1; i.Image=img or "rbxassetid://0"; i.Size=UDim2.fromScale(w or 0.9,h or 0.42); i.Position=UDim2.fromScale((1-(w or 0.9))/2,y or 0.1)
 return i
end
return L
