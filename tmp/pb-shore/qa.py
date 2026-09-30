import pypdfium2 as pdfium,pathlib
from PIL import Image,ImageDraw
p=pathlib.Path('output/pdf/Informe_comparativo_PB_SHORE_PRUEBA.pdf');d=pdfium.PdfDocument(str(p));print('PAGES',len(d))
for i,pg in enumerate(d):
 text=pg.get_textpage().get_text_range();print(i+1,text[:65].replace('\r\n',' / '))
 im=pg.render(scale=1.25).to_pil();im.save(f'tmp/pb-shore/report-{i+1:02}.png')
for start in range(0,len(d),6):
 sheet=Image.new('RGB',(1500,1420),'#cccccc')
 for j in range(min(6,len(d)-start)):
  im=Image.open(f'tmp/pb-shore/report-{start+j+1:02}.png');im.thumbnail((490,700));sheet.paste(im,((j%3)*500,(j//3)*710))
 sheet.save(f'tmp/pb-shore/report-contact-{start//6}.png')
