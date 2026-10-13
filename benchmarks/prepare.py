import hashlib,json,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'studies/ais-pilot'))
from prepare_packets import prepare,UPSTREAM_SHA256

def write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    texts=['A\U0001f600B','e\u0301 cafe','\u0645\u0631\u062d\u0628\u0627','line\r\nsecond','\U0001d49c\U0001f600e\u0301\r\n\u05d0\u05d1','Caf\u00e9','Cafe\u0301','zero\u200dwidth']
    for split,offset in [('dev',0),('test',4)]:
        rows=[];keys=[]
        for i,text in enumerate(texts[offset:offset+4]):
            row={'id':f'{split}-{i}','text':text,'start_codepoint':0,'end_codepoint':len(text)}
            rows.append(row);keys.append({'id':row['id'],'start_utf16':0,'end_utf16':len(text.encode('utf-16-le'))//2,'exact':text})
        write(ROOT/f'v1/{split}/stress.json',rows);write(ROOT/f'v1/answer-keys/{split}.json',keys)
    raw=(ROOT/'downloads/alce.json').read_bytes()
    if hashlib.sha256(raw).hexdigest()!=UPSTREAM_SHA256: raise ValueError('Corpus checksum mismatch')
    prepared=prepare(json.loads(raw));population=prepared['population'];packet=prepared['reviewer_a']
    for split,group in [('dev',{'a1','a2','a3','a4'}),('test',{'a5','a6','a7','a8'})]:
        claims=[c for c in packet['claims'] if c['id'].split('-')[0] in group]
        ids={s for c in claims for s in c['citation_ids']}
        subset={**packet,'claims':claims,'sources':[s for s in packet['sources'] if s['id'] in ids]}
        write(ROOT/f'artifacts/{split}/alce-packet.json',subset)
        write(ROOT/f'artifacts/answer-keys/{split}-alce.json',[item for item in population['items'] if item['source_id'] in ids])
    packaged={str(p.relative_to(ROOT)).replace('\\','/'):p for directory in [ROOT/'v1',ROOT/'artifacts/dev',ROOT/'artifacts/test',ROOT/'artifacts/answer-keys'] for p in sorted(directory.rglob('*.json'))}
    for name in ['DATASHEET.md','DATASET_CARD.md','croissant.json']:packaged[name]=ROOT/name
    packaged['ALCE-LICENSE.txt']=ROOT/'downloads/ALCE-LICENSE.txt'
    for name in ['claim-review-packet.v1.json','stress.v1.json','labels.v1.json']:packaged['schema/'+name]=ROOT.parent/'schema'/name
    manifest={name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in sorted(packaged.items())}
    write(ROOT/'artifacts/checksums.json',manifest)
    packaged['checksums.json']=ROOT/'artifacts/checksums.json'
    with zipfile.ZipFile(ROOT/'artifacts/siftgrain-cite-v1.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,path in sorted(packaged.items()):
            info=zipfile.ZipInfo(name,date_time=(2026,10,13,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
            z.writestr(info,path.read_bytes(),compresslevel=9)
    print('Prepared stress splits, checksum-pinned external gold and deterministic local archive')
if __name__=='__main__':main()
