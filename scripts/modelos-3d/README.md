# Modelos 3D do portfólio

Os arquivos `site/modelos/*.glb` saem do Revit em três passos:

1. **Extração (Revit):** rodar `exportar-portal.py` ou `exportar-residencia.py` no
   Revit com o modelo aberto (pyRevit ou a rota `execute_code` do conector MCP),
   definindo antes `SAIDA = r'C:\caminho\modelo.obj'`. O script grava um OBJ com um
   grupo por material: sistemas hidrossanitários com as cores da legenda, a
   silhueta das paredes da arquitetura vinculada (`casa`, translúcida) ou concreto
   e aço no portal.
2. **Materiais:** copiar o `.mtl` desta pasta para junto do OBJ, com o mesmo nome
   citado em `mtllib`.
3. **Conversão e compressão** (Node, fora do projeto):

   ```
   npx obj2gltf -i modelo.obj -o bruto.glb
   npx @gltf-transform/cli weld bruto.glb a.glb
   npx @gltf-transform/cli simplify a.glb b.glb --ratio 0.5 --error 0.002   # só na residência
   npx @gltf-transform/cli quantize b.glb final.glb
   ```

   A quantização dispensa decodificador no navegador. Meta: menos de 1 MB por modelo.
