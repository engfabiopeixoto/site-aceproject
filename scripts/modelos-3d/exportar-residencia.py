# Instalações (por sistema) + silhueta da casa (paredes, lajes, telhados do vínculo), em OBJ.
F=0.3048
out=SAIDA  # caminho do .obj de saída, definido antes de rodar
opt=DB.Options(); opt.DetailLevel=DB.ViewDetailLevel.Fine
def solidos(g, tf):
    for o in g:
        if isinstance(o,DB.Solid) and o.Faces.Size>0: yield DB.SolidUtils.CreateTransformed(o,tf) if tf else o
        elif isinstance(o,DB.GeometryInstance):
            for s in solidos(o.GetInstanceGeometry(), tf): yield s
def classe(e,c):
    if c==DB.BuiltInCategory.OST_PlumbingFixtures: return 'pecas'
    p=e.get_Parameter(DB.BuiltInParameter.RBS_SYSTEM_CLASSIFICATION_PARAM)
    s=(p.AsString() if p else '') or ''
    s=s.lower()
    if 'fria' in s: return 'agua_fria'
    if 'quente' in s: return 'agua_quente'
    if 'sanit' in s: return 'sanitario'
    if 'ventil' in s: return 'ventilacao'
    if c==DB.BuiltInCategory.OST_MechanicalEquipment: return 'equipamentos'
    return 'outro'
grupos={}
def add(k,s,lod):
    lst=grupos.setdefault(k,[])
    for f in s.Faces:
        try: m=f.Triangulate(lod)
        except: continue
        vs=[m.Vertices[i] for i in range(m.Vertices.Count)]
        for t in range(m.NumTriangles):
            tr=m.get_Triangle(t)
            lst.append([(vs[tr.get_Index(j)].X*F,vs[tr.get_Index(j)].Z*F,-vs[tr.get_Index(j)].Y*F) for j in range(3)])
cats=[DB.BuiltInCategory.OST_PipeCurves,DB.BuiltInCategory.OST_PipeFitting,DB.BuiltInCategory.OST_PipeAccessory,DB.BuiltInCategory.OST_PlumbingFixtures,DB.BuiltInCategory.OST_MechanicalEquipment]
for c in cats:
    for e in DB.FilteredElementCollector(doc).OfCategory(c).WhereElementIsNotElementType():
        bb=e.get_BoundingBox(None)
        if bb is None or bb.Min.Z*F < -10: continue
        g=e.get_Geometry(opt)
        if g is None: continue
        for s in solidos(g,None): add(classe(e,c),s,0.0)
for li in DB.FilteredElementCollector(doc).OfClass(DB.RevitLinkInstance):
    ld=li.GetLinkDocument()
    if ld is None: continue
    tf=li.GetTotalTransform()
    for c in [DB.BuiltInCategory.OST_Walls]:
        for e in DB.FilteredElementCollector(ld).OfCategory(c).WhereElementIsNotElementType():
            g=e.get_Geometry(opt)
            if g is None: continue
            for s in solidos(g,tf): add('casa',s,0.0)
fh=open(out,'w'); vi=1
fh.write('mtllib residencia.mtl\n')
for k,tris in grupos.items():
    fh.write('o %s\nusemtl %s\n'%(k,k))
    for t in tris:
        for v in t: fh.write('v %.4f %.4f %.4f\n'%v)
        fh.write('f %d %d %d\n'%(vi,vi+1,vi+2)); vi+=3
fh.close()
print({k:len(v) for k,v in grupos.items()})
