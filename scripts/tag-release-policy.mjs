import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';

export function validateSource({repository,tag,source,pkg}) {
  const match=/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(tag);
  if(!match || (match[4]&&match[4].split('.').some(x=>/^\d+$/.test(x)&&x.length>1&&x[0]==='0')))throw Error('Invalid release tag');
  if(!['martlet','krigsvold'].includes(source.family)||!['vim','emacs','chrome','firefox'].includes(source.kind))throw Error('Invalid distribution identity');
  if(repository!==`${source.family}design/${source.kind}` || pkg.name!==`${source.family}-${source.kind}-source` || pkg.private!==true || source.version!==tag.slice(1) || pkg.version!==source.version)throw Error('Tag, source or repository identity mismatch');
  return {version:source.version,prerelease:Boolean(match[4])};
}
export function validateProduction({git,tag,sha,protectedRef}) {
  if(protectedRef!=='true'||!/^[a-f0-9]{40}$/.test(sha))throw Error('Unprotected tag or invalid SHA');
  const commit=git(['rev-parse',`refs/tags/${tag}^{commit}`]).trim();
  if(commit!==sha||git(['rev-parse','HEAD']).trim()!==sha||!git(['rev-list','--first-parent','refs/remotes/origin/main']).trim().split('\n').includes(sha))throw Error('Tag is not on approved main first-parent history');
  const local=git(['rev-parse',`refs/tags/${tag}`]).trim(), remote=git(['ls-remote','--refs','origin',`refs/tags/${tag}`]).trim().split(/\s+/);
  if(remote.length!==2||remote[0]!==local||remote[1]!==`refs/tags/${tag}`)throw Error('Tag changed or is unavailable');
}
export async function checkFromEnvironment(env) {
  const [source,pkg]=await Promise.all(['source.json','package.json'].map(async path=>JSON.parse(await readFile(path,'utf8'))));
  validateSource({repository:env.GITHUB_REPOSITORY,tag:env.RELEASE_TAG,source,pkg});
  validateProduction({git:args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}),tag:env.RELEASE_TAG,sha:env.GITHUB_SHA,protectedRef:env.REF_PROTECTED});
}
