import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSource,validateProduction} from './tag-release-policy.mjs';

test('all native repository identities match their source, tag and private build manifest',()=>{
  for(const family of ['martlet','krigsvold'])for(const kind of ['vim','emacs','chrome','firefox']){
    const source={family,kind,version:'1.2.3'},pkg={name:`${family}-${kind}-source`,version:'1.2.3',private:true};
    const good={repository:`${family}design/${kind}`,tag:'v1.2.3',source,pkg};assert.equal(validateSource(good).version,'1.2.3');
    for(const bad of [{tag:'v01.2.3'},{repository:'other/repo'},{source:{...source,version:'1.2.4'}},{pkg:{...pkg,private:false}}])assert.throws(()=>validateSource({...good,...bad}));
  }
});
test('protected flag, event SHA, first-parent history and unchanged remote tag are required',()=>{
  const sha='1'.repeat(40),object='2'.repeat(40),tag='v1.2.3';
  const git=a=>a[0]==='ls-remote'?`${object}\trefs/tags/${tag}`:a[0]==='rev-list'?sha:(a.at(-1).endsWith('^{commit}')||a.at(-1)==='HEAD'?sha:object);
  validateProduction({git,tag,sha,protectedRef:'true'});
  assert.throws(()=>validateProduction({git,tag,sha,protectedRef:'false'}));
  assert.throws(()=>validateProduction({git:a=>a[0]==='rev-list'?'3'.repeat(40):git(a),tag,sha,protectedRef:'true'}));
  assert.throws(()=>validateProduction({git:a=>a[0]==='ls-remote'?'':git(a),tag,sha,protectedRef:'true'}));
});
test('tag artifact and release jobs remain disabled and do not submit to stores',async()=>{
  const workflow=await readFile('.github/workflows/native-release.yml','utf8');
  assert.equal((workflow.match(/if:\s*\$\{\{ false \}\}/g)??[]).length,3);
  assert.match(workflow,/uses:\s*\.\/\.github\/workflows\/verify\.yml/);
  assert.match(workflow,/sha256sum --check dist\/SHA256SUMS/);
  assert.match(workflow,/gh release create/);
  assert.match(workflow,/gh release download/);
  assert.match(workflow,/cmp dist\/SHA256SUMS/);
  assert.doesNotMatch(workflow,/npm publish|webstore|addons\.mozilla\.org/);
});

test('release shell rejects existing or unavailable releases and verifies exact downloaded bytes',async()=>{
  const {mkdtemp,mkdir,writeFile,readFile:read,rm}=await import('node:fs/promises');
  const {tmpdir}=await import('node:os');
  const {join}=await import('node:path');
  const {spawnSync}=await import('node:child_process');
  const workflow=await read('.github/workflows/native-release.yml','utf8');
  const scriptFor=name=>{
    const match=workflow.match(new RegExp(`- name: ${name}[^\\n]*\\n\\s+run: \\|\\n((?: {10}.+\\n)+)`));
    assert.ok(match,`Missing workflow step ${name}`);
    return match[1].replace(/^ {10}/gm,'');
  };
  const create=scriptFor('Create new GitHub release'), verify=scriptFor('Re-download and compare');
  const cwd=await mkdtemp(join(tmpdir(),'native-release-test-'));
  const run=(cmd,env)=>spawnSync('bash',['-c',cmd],{cwd,env:{...process.env,...env},encoding:'utf8'});
  try{
    await Promise.all(['bin','dist','remote'].map(x=>mkdir(join(cwd,x))));
    await writeFile(join(cwd,'dist','sample.zip'),'expected bytes');
    assert.equal(run('sha256sum dist/sample.zip > dist/SHA256SUMS',{}).status,0);
    await writeFile(join(cwd,'bin','curl'),'#!/bin/sh\nprintf "%s" "$FAKE_STATUS"\n',{mode:0o755});
    await writeFile(join(cwd,'bin','gh'),`#!/bin/bash\nset -eu\nif [ "$2" = create ]; then printf '%s\\n' "$@" > "$CAPTURE"; cp dist/* "$REMOTE"/; elif [ "$2" = download ]; then cp "$REMOTE"/* release-check/; else exit 9; fi\n`,{mode:0o755});
    const env={PATH:`${join(cwd,'bin')}:${process.env.PATH}`,RELEASE_TAG:'v1.2.3-beta.1',GITHUB_REPOSITORY:'martletdesign/chrome',GH_TOKEN:'local-placeholder',FAKE_STATUS:'404',CAPTURE:join(cwd,'capture'),REMOTE:join(cwd,'remote')};
    assert.equal(run(create,env).status,0);assert.match(await read(env.CAPTURE,'utf8'),/--prerelease/);
    assert.equal(run(verify,env).status,0);
    await writeFile(join(cwd,'remote','sample.zip'),'altered bytes');await rm(join(cwd,'release-check'),{recursive:true});
    assert.notEqual(run(verify,env).status,0,'modified release artifact must fail');
    for(const status of ['200','403','500'])assert.notEqual(run(create,{...env,FAKE_STATUS:status}).status,0,`HTTP ${status} must fail closed`);
  }finally{await rm(cwd,{recursive:true,force:true});}
});
