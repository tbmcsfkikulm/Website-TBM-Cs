import unittest,json,re,copy
from pathlib import Path
import build
class BuildTests(unittest.TestCase):
 def setUp(self):self.data=json.loads((build.ROOT/'content/site.json').read_text())
 def test_schema(self):self.assertEqual(len(build.validate(self.data)['rentals']),13)
 def test_drafts_not_in_public_html(self):
  self.data['posts']=[{'slug':'uji-draft','title':'PRIVATE-DRAFT-MARKER','status':'draft','body':'DRAFT-BODY-MARKER'}]
  out=build.render(self.data);self.assertNotIn('PRIVATE-DRAFT-MARKER',out);self.assertNotIn('DRAFT-BODY-MARKER',out)
 def test_script_injection_escaped(self):
  self.data['posts']=[{'slug':'uji','title':'</script><script>alert(1)</script>','status':'published','body':'A & B'}]
  out=build.render(self.data);self.assertNotIn('</script><script>alert(1)</script>',out);self.assertIn('\\u003c/script\\u003e',out)
 def test_duplicate_slug_rejected(self):
  self.data['pages'].append(copy.deepcopy(self.data['pages'][0]))
  with self.assertRaises(ValueError):build.validate(self.data)
 def test_unsafe_cover_rejected(self):
  self.data['pages'][0]['cover']='javascript:alert(1)'
  with self.assertRaises(ValueError):build.validate(self.data)
 def test_upload_path_escape_rejected(self):
  self.data['pages'][0]['cover']='/uploads/../../build.py'
  with self.assertRaises(ValueError):build.public_data(self.data)
 def test_negative_price_rejected(self):
  self.data['rentals'][0]['price']=-1
  with self.assertRaises(ValueError):build.validate(self.data)
 def test_no_platform_dependency(self):
  out=build.render(self.data)
  for text in ['<b:','<data:','expr:','blogspot.com','blogger.com','/feeds/posts','googleapis.com','googlesyndication.com']:
   self.assertNotIn(text,out)
  self.assertNotRegex(out,r'<script[^>]+src=')
 def test_rich_content_compatibility(self):
  item={'slug':'uji-rich','title':'Uji','status':'published','body':'Isi','body_html':'<p>Isi <img src="/uploads/foto.webp" onerror="alert(1)"></p>'}
  self.data['posts']=[item]
  self.assertEqual(build.validate(self.data)['posts'][0]['body_html'],item['body_html'])
  out=build.render(self.data)
  self.assertNotIn('<img src="/uploads/foto.webp" onerror=',out)
  payload=re.search(r'<script id="site-data" type="application/json">(.*?)</script>',out,re.S).group(1)
  self.assertEqual(json.loads(payload)['posts'][0]['body_html'],item['body_html'])
  item['status']='draft';self.assertNotIn('foto.webp',build.render(self.data))
  item['body_html']={}
  with self.assertRaises(ValueError):build.validate(self.data)
 def test_favicon_files(self):
  out=build.render(self.data)
  self.assertIn('href="/favicon.ico"',out)
  self.assertEqual((build.ROOT/'public/favicon.ico').read_bytes()[:4],bytes([0,0,1,0]))
  self.assertEqual((build.ROOT/'public/favicon.png').read_bytes()[:8],b'\x89PNG\r\n\x1a\n')
 def test_internal_routes(self):
  out=(build.ROOT/'src/shell.html').read_text();slugs={x['slug'] for x in self.data['pages']}
  for slug in re.findall('href="#page/([^"#]+)',out):self.assertIn(slug,slugs)
if __name__=='__main__':unittest.main()
