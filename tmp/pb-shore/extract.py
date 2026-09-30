import pathlib,json,pdfplumber
root=pathlib.Path('tmp/pb-shore')
raw=(root/'cotizacion-raw.txt').read_text(encoding='utf-8-sig'); data=json.loads(raw[raw.index('['):])[0]['datos']; (root/'cotizacion.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
texts=[]
for p in pathlib.Path('PB SHORE PRUEBA').rglob('*.pdf'):
 with pdfplumber.open(p) as pdf:
  pages=[page.extract_text() or '' for page in pdf.pages]
 texts.append({'file':str(p),'pages':pages})
(root/'hdr-textos.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2),encoding='utf-8')
for t in texts:
 print('\nFILE:',t['file']); print('\n'.join(t['pages']))
