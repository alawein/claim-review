import hashlib
from pathlib import Path
from urllib.request import urlopen
URL='https://raw.githubusercontent.com/princeton-nlp/ALCE/246c476a4edfc564266b7346b6e29ef4861ae937/human_eval/human_eval_citations_completed.json'
SHA='cfed9293752413d7c7631f36524dd4ee9ef58b209cdf9c63f6fc1e280b43cca6'
def main():
    path=Path(__file__).parent/'downloads/alce.json'
    raw=path.read_bytes() if path.exists() else urlopen(URL,timeout=60).read()
    if hashlib.sha256(raw).hexdigest()!=SHA: raise ValueError('Upstream checksum mismatch')
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(raw)
    license_path=path.parent/'ALCE-LICENSE.txt'
    license_raw=license_path.read_bytes() if license_path.exists() else urlopen(URL.rsplit('/',2)[0]+'/LICENSE',timeout=60).read()
    if hashlib.sha256(license_raw).hexdigest()!='8872dbf8660b00890b5e07ce1ea1f7a44fa7ae4e1857da56caba172b51dab3cb': raise ValueError('License checksum mismatch')
    license_path.write_bytes(license_raw)
    print('Pinned ALCE corpus and license verified')
if __name__=='__main__': main()
