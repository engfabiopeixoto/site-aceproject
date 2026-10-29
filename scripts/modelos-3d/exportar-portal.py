# Portal Demerval: pilares e vigas de concreto + treliças metálicas, acima do térreo (Z >= 1,20 m).
F=0.3048
out=SAIDA  # caminho do .obj de saída, definido antes de rodar
print('doc', doc.Title)
opt=DB.Options(); opt.DetailLevel=DB.ViewDetailLevel.Fine
COM=u'Treli\xe7a met\xe1lica Demerval (ACE/MCP)'
def solidos(g):
    for o in g:
        if isinstance(o,DB.Solid) and o.Faces.Size>0: yield o
        elif isinstance(o,DB.GeometryInstance):
            for s in solidos(o.GetInstanceGeometry()): yield s
grupos={}
for c in [DB.BuiltInCategory.OST_StructuralColumns,DB.BuiltInCategory.OST_StructuralFraming]:
    for e in DB.FilteredElementCollector(doc).OfCategory(c).WhereElementIsNotElementType():
        bb=e.get_BoundingBox(None)
        if bb is None or bb.Max.Z*F < 1.25: continue
        p=e.get_Parameter(DB.BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS)
        k='aco' if (p and p.AsString()==COM) else 'concreto'
        g=e.get_Geometry(opt)
        if g is None: continue
        lst=grupos.setdefault(k,[])
        for s in solidos(g):
            for f in s.Faces:
                try: m=f.Triangulate(0.0)
                except: continue
                vs=[m.Vertices[i] for i in range(m.Vertices.Count)]
                for t in range(m.NumTriangles):
                    tr=m.get_Triangle(t)
                    pts=[vs[tr.get_Index(j)] for j in range(3)]
                    if max(v.Z for v in pts)*F < 1.2: continue
                    lst.append([(v.X*F,(max(v.Z,1.2/F)*F)-1.2,-v.Y*F) for v in pts])
fh=open(out,'w'); fh.write('mtllib portal.mtl\n'); vi=1
for k,tris in grupos.items():
    fh.write('o %s\nusemtl %s\n'%(k,k))
    for t in tris:
        for v in t: fh.write('v %.4f %.4f %.4f\n'%v)
        fh.write('f %d %d %d\n'%(vi,vi+1,vi+2)); vi+=3
fh.close()
print({k:len(v) for k,v in grupos.items()})
