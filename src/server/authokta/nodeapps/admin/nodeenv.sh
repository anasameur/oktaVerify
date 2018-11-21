export PATH=/opt/nodejs/node-v8.9.1-linux-x64/bin:$PATH
export APP_PATH=/opt/authokta/nodeapps/apps
export NODE_ENV=production
npm config set proxy http://proxy.cofely-fr.gdfsuez.net:8080/ 
npm config set https-proxy http://proxy.cofely-fr.gdfsuez.net:8080/