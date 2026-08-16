npm run build
zip -r build.zip build

scp -r build.zip administrator@192.168.66.24:~/
# scp server/cloud/main.js administrator@192.168.66.24:~/
# scp server/config.js administrator@192.168.66.24:~/

ssh administrator@192.168.66.24 '/home/administrator/deploy.sh'