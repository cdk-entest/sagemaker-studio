cdk bootstrap aws://014600194779/ap-southeast-1
cdk --app 'npx ts-node --prefer-ts-exts bin/sg-ml-environment.ts' synth  
cdk --app 'npx ts-node --prefer-ts-exts bin/sg-ml-environment.ts' deploy --all 
