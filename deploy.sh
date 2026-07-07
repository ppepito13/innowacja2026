npm run build
zip -r build.zip build
scp -r build.zip administrator@192.168.66.24:~/
