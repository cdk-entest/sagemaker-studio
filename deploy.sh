cdk bootstrap aws://413175686616/us-east-1
cdk --app 'npx ts-node --prefer-ts-exts bin/sg-ml-environment.ts' synth  
cdk --app 'npx ts-node --prefer-ts-exts bin/sg-ml-environment.ts' deploy --all 
