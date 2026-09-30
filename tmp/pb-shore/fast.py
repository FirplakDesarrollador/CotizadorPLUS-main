import pathlib,json,pypdfium2 as pdfium
out=[]
for p in pathlib.Path('PB SHORE PRUEBA').rglob('*.pdf'):
 d=pdfium.PdfDocument(str(p)); pages=[pg.get_textpage().get_text_range() for pg in d];out.append({'file':str(p),'pages':pages}); print(p.name, len(pages),flush=True)
pathlib.Path('tmp/pb-shore/hdr-fast.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
