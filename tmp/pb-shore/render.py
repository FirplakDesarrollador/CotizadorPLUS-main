import pathlib,pypdfium2 as pdfium
from PIL import Image,ImageDraw
files=list(pathlib.Path('PB SHORE PRUEBA').rglob('*.pdf'))
for start in range(0,len(files),6):
 sheet=Image.new('RGB',(1800,3*660),'#dddddd'); draw=ImageDraw.Draw(sheet)
 for j,p in enumerate(files[start:start+6]):
  doc=pdfium.PdfDocument(str(p)); im=doc[0].render(scale=1.3).to_pil(); im.thumbnail((890,625)); x=(j%2)*900;y=(j//2)*660
  sheet.paste(im,(x,y+30));draw.text((x+5,y+5),p.name[:90],fill='black')
 sheet.save(f'tmp/pb-shore/contact-{start//6}.png')
