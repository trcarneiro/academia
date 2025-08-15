const fs = require('fs');
const path = require('path');

function walk(dir){
  let results = [];
  fs.readdirSync(dir).forEach(file=>{
    const f = path.join(dir,file);
    const stat = fs.statSync(f);
    if(stat && stat.isDirectory()) results = results.concat(walk(f));
    else results.push(f);
  });
  return results;
}

function convertContent(content){
  // replace simple onclick patterns: fnName(), fnName('a'), fnName("a"), fnName('a','b')
  return content.replace(/onclick\s*=\s*"([a-zA-Z0-9_$.]+)\s*\(([^)]*)\)"/g, (m, fn, argsRaw)=>{
    let args = [];
    const raw = argsRaw.trim();
    if(raw.length>0){
      // split by comma not inside quotes
      const parts = raw.match(/('(?:\\'|[^'])*'|"(?:\\\"|[^"])*"|[^,]+)/g) || [];
      args = parts.map(p=>{
        p=p.trim();
        if(/^'.*'$/.test(p) || /^\".*\"$/.test(p)){
          // strip quotes
          return p.slice(1,-1).replace(/\\'/g, "'").replace(/\\\"/g,'"');
        }
        if(/^\d+$/.test(p)) return Number(p);
        if(p==="true"||p==="false") return p==='true';
        return p; // fallback
      });
    }
    const argsJson = JSON.stringify(args).replace(/</g,'\\u003c');
    return `data-action="${fn}" data-args='${argsJson}'`;
  });
}

const targets = [path.join(__dirname,'..','public','views'), path.join(__dirname,'..','public','modules')];
let changedFiles = [];
for(const t of targets){
  if(!fs.existsSync(t)) continue;
  const files = walk(t).filter(f=>/\.(html|htm|js)$/.test(f));
  for(const f of files){
    let content = fs.readFileSync(f,'utf8');
    if(content.indexOf('onclick')===-1) continue;
    const newContent = convertContent(content);
    if(newContent !== content){
      fs.writeFileSync(f,newContent,'utf8');
      changedFiles.push(f);
    }
  }
}
console.log('Converted files:', changedFiles.length);
changedFiles.forEach(f=>console.log(f));
